"use client";

import BestNineSettingsFields, {
  BestNineLivePerformanceField,
} from "./BestNineSettingsFields";
import BestNineLiveSelector from "./BestNineLiveSelector";
import useBestNineLiveCatalog from "@/app/hook/useBestNineLiveCatalog";
import {
  isBestNineVideoAllowed,
  isBestNineLiveAllowed,
  matchingLiveChoices,
  getBestNineLiveRecordings,
  bestNineLiveChoiceKey,
  type BestNineLiveChoice,
} from "@/app/lib/bestNineLive";
import {
  bestNineSettingsSnapshot,
  type BestNineSettings,
} from "@/app/lib/bestNineSettings";
import { bestNineEntryKey } from "@/app/lib/myBestNineSongs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  TextInput,
  Button as MantineButton,
  Stack,
  ScrollArea,
  Tooltip,
  Group,
  Text,
  Grid,
  Skeleton,
  Breadcrumbs,
  Accordion,
  Modal,
  Alert,
  ActionIcon,
  Select,
} from "@mantine/core";
import { MdContentCopy } from "react-icons/md";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Song } from "../../types/song";
import useMyBestNineSongsDraft from "../../hook/useMyBestNineSongsDraft";
import useSearch from "../../hook/useSearch";
import {
  BEST_NINE_CATEGORIES,
  bestNineCategoryLabel,
  emptySlotCategories,
  hasCategoryRestrictions,
  hasLiveSetlistCategory,
  matchesBestNineCategory,
  normalizeSlotCategories,
  type BestNineCategory,
} from "@/app/lib/bestNineCategories";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import useSongs from "../../hook/useSongs";
import { HiChevronRight, HiHome, HiSearch, HiCheck, HiX } from "react-icons/hi";
import { breadcrumbClasses, pageClasses } from "@/app/theme";
import { Link, getPathname } from "@/i18n/navigation";
import { useGlobalPlayer } from "../../hook/useGlobalPlayer";
import { FaPlay } from "react-icons/fa6";
import { showAppNotification } from "@/app/lib/notifications";

import {
  decodeThemes,
  emptyThemes,
  hasThemes,
  normalizeSelection,
  resolveBestNineSlots,
} from "@/app/lib/myBestNineSongs";
import type { MyBestNineSongsEntry } from "@/app/lib/myBestNineSongs";

import useBestNineTopic from "@/app/hook/useBestNineTopic";
import styles from "./client.module.css";
import BestNineThemeFields from "./BestNineThemeFields";
import BestNineTopicCreateModal from "./BestNineTopicCreateModal";

import { formatDate } from "../../lib/formatDate";

const formatBroadcastDate = (
  value: string,
  locale?: string,
  t?: (key: string) => string,
): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return t ? t("myBest9.unknownBroadcastDate") : "配信日不明";
  }
  return formatDate(date, locale);
};

/**
 * 好きな楽曲9選作成ページ
 * 全楽曲から最大9曲を選んで、共有URLを生成
 */
export default function MyBestNineSongsPage() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");
  const topicState = useBestNineTopic(
    topicId,
    searchParams.get("resumeTopic") === "1",
  );
  const [createOpened, setCreateOpened] = useState(
    searchParams.get("new") === "1",
  );
  const definitionLocked =
    !!topicId && (!topicState.topic?.canEdit || !topicState.editing);
  const beforeEditRef = useRef<{
    title: string;
    themes: string[];
    entries: MyBestNineSongsEntry[];
    slotCategories: BestNineCategory[][];
    settings: BestNineSettings;
  } | null>(null);
  const queryTitle = useMemo(() => {
    const raw = searchParams.get("title");
    if (!raw) return null;
    const normalized = raw.trim();
    if (!normalized) return null;
    return normalized.slice(0, 50);
  }, [searchParams]);

  // 初回ロード時のqueryTitleをrefに保持し、以降の再レンダリングで上書きされないようにする
  const initialTemplateRef = useRef({
    title: queryTitle,
    themes: searchParams.has("themes")
      ? decodeThemes(searchParams.get("themes")!)
      : undefined,
  });
  // ドラフト復元を1回のみ実行するフラグ
  const hasRestoredDraftRef = useRef(false);

  const [settings, setSettings] = useState<BestNineSettings>({});
  const [pendingSettings, setPendingSettings] =
    useState<BestNineSettings | null>(null);
  const songCount = settings.songCount ?? 9;
  const [browseLiveId, setBrowseLiveId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<BestNineCategory>("all");
  const [title, setTitle] = useState(() => queryTitle || "");
  const [author, setAuthor] = useState("");
  const [entries, setEntries] = useState<MyBestNineSongsEntry[]>([]);
  const [themes, setThemes] = useState<string[]>(
    () => initialTemplateRef.current.themes ?? emptyThemes(),
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [pendingDefinition, setPendingDefinition] = useState<{
    themes: string[];
    slotCategories: BestNineCategory[][];
    removeInvalid?: boolean;
  } | null>(null);
  const [slotCategories, setSlotCategories] = useState(emptySlotCategories);
  const restricted = hasCategoryRestrictions(
    slotCategories.slice(0, songCount),
  );
  const themed = hasThemes(themes.slice(0, songCount)) || restricted;
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedThemeUrl, setCopiedThemeUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerateLocked, setIsGenerateLocked] = useState(false);
  const lockedSelectionKeyRef = useRef<string | null>(null);
  const songListViewportRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  const {
    draft,
    isReady: isDraftReady,
    saveDraft,
    clearDraft,
  } = useMyBestNineSongsDraft();
  const { allSongs, isLoading } = useSongs();
  const needsLiveCatalog =
    activeFilter === "live-setlist" ||
    !!settings.allowedLiveIds?.length ||
    slotCategories.some((categories) => categories.includes("live-setlist"));
  const liveCatalog = useBestNineLiveCatalog(needsLiveCatalog);
  const scopedLiveChoices = useMemo(
    () =>
      liveCatalog.choices.filter(
        (choice) =>
          !settings.allowedLiveIds?.length ||
          settings.allowedLiveIds.includes(choice.liveId),
      ),
    [liveCatalog.choices, settings.allowedLiveIds],
  );
  const performanceLiveChoices = useMemo(
    () =>
      scopedLiveChoices.filter(
        (choice) => !browseLiveId || choice.liveId === browseLiveId,
      ),
    [scopedLiveChoices, browseLiveId],
  );
  const liveRecordings = useMemo(
    () => getBestNineLiveRecordings(liveCatalog.choices, allSongs),
    [liveCatalog.choices, allSongs],
  );
  const locale = useLocale();
  const t = useTranslations("Share");
  const dm = useTranslations("DrawerMenu");
  const slots = useMemo(
    () =>
      resolveBestNineSlots(
        { title, themes, songs: entries, songCount },
        allSongs,
      ),
    [title, themes, entries, allSongs, songCount],
  );
  const selectedSongs = slots.flatMap((slot) => (slot.song ? [slot.song] : []));
  const { setCurrentSong, setCurrentTime, setIsPlaying, setIsMinimized } =
    useGlobalPlayer();

  const handlePreviewSong = (song: Song) => {
    setCurrentSong(song);
    setCurrentTime(Number(song.start));
    setIsMinimized(true);
    setIsPlaying(true);
  };

  const activeCategories = slotCategories[themed ? activeSlot : 0];
  const effectiveFilter =
    activeFilter === "all" ||
    activeCategories.includes("all") ||
    activeCategories.includes(activeFilter)
      ? activeFilter
      : "all";
  const liveSelectionMode =
    effectiveFilter === "live-setlist" ||
    (effectiveFilter === "all" &&
      (!!settings.allowedLiveIds?.length ||
        (activeCategories.length === 1 &&
          activeCategories[0] === "live-setlist")));
  const categoryFilteredSongs = useMemo(
    () =>
      allSongs.filter(
        (song) =>
          isBestNineVideoAllowed(
            song,
            activeCategories,
            liveCatalog.choices,
            settings.allowedLiveIds,
            allSongs,
          ) &&
          (effectiveFilter === "live-setlist"
            ? matchingLiveChoices(song, performanceLiveChoices).length > 0
            : matchesBestNineCategory(song, effectiveFilter)) &&
          (!browseLiveId ||
            matchingLiveChoices(song, performanceLiveChoices).length > 0),
      ),
    [
      allSongs,
      activeCategories,
      effectiveFilter,
      liveCatalog.choices,
      settings.allowedLiveIds,
      browseLiveId,
      performanceLiveChoices,
    ],
  );
  const invalidSlots = slots.filter(
    (slot) =>
      slot.entry &&
      (slot.song
        ? !isBestNineVideoAllowed(
            slot.song,
            slotCategories[slot.slot],
            liveCatalog.choices,
            settings.allowedLiveIds,
            allSongs,
          )
        : slot.live
          ? !isBestNineLiveAllowed(
              slot.live,
              slotCategories[slot.slot],
              settings.allowedLiveIds,
            )
          : true),
  );
  const overflowEntries = entries.filter(
    (entry, index) => (entry.slot ?? index) >= songCount,
  );
  const invalidSelection =
    invalidSlots.length > 0 || overflowEntries.length > 0;
  const applySettings = (next: BestNineSettings, confirmed = false) => {
    next = {
      ...next,
      allowedLiveIds: hasLiveSetlistCategory(slotCategories, next.songCount)
        ? next.allowedLiveIds
        : [],
    };
    const affected = entries.filter(
      (entry, index) =>
        (entry.slot ?? index) >= (next.songCount ?? 9) ||
        (entry.kind === "live"
          ? !entry.snapshot ||
            !isBestNineLiveAllowed(
              entry.snapshot,
              slotCategories[entry.slot ?? index],
              next.allowedLiveIds,
            )
          : !isBestNineVideoAllowed(
              allSongs.find(
                (song) =>
                  song.video_id === entry.v && String(song.start) === entry.s,
              )!,
              slotCategories[entry.slot ?? index],
              liveCatalog.choices,
              next.allowedLiveIds,
              allSongs,
            )),
    );
    if (affected.length && !confirmed) {
      setPendingSettings(next);
      return;
    }
    setSettings(next);
    setActiveSlot(0);
    setBrowseLiveId(null);
    saveSelection(
      entries.filter((entry) => !affected.includes(entry)),
      themes,
      title,
      author,
      slotCategories,
      next,
    );
    setPendingSettings(null);
  };

  // 同一動画・同一開始秒の重複行を除外（React key重複と二重表示を防ぐ）
  const uniqueCategorySongs = useMemo(() => {
    const seen = new Set<string>();
    return categoryFilteredSongs.filter((song) => {
      const dedupeKey = `${song.video_id}-${String(song.start)}`;
      if (seen.has(dedupeKey)) {
        return false;
      }
      seen.add(dedupeKey);
      return true;
    });
  }, [categoryFilteredSongs]);

  // カテゴリーフィルター済みの曲に対して検索を適用（URL同期なし）
  const {
    songs: searchedSongs,
    searchTerm: songSearchQuery,
    setSearchTerm: setSongSearchQuery,
  } = useSearch(uniqueCategorySongs, { syncUrl: false });

  // 検索クエリがない場合はカテゴリー結果をそのまま使う（初期表示の遅延を防ぐ）
  const displayedSongs = songSearchQuery.trim()
    ? searchedSongs
    : uniqueCategorySongs;

  // タイル一覧の表示幅から列数を計算（640px未満:3、640px以上:4、768px以上:5）
  const tileColumnCount = useMemo(() => {
    if (windowWidth >= 768) return 5;
    if (windowWidth >= 640) return 4;
    return 3;
  }, [windowWidth]);

  const tileRowCount = useMemo(() => {
    if (tileColumnCount <= 0) return 0;
    return Math.ceil(displayedSongs.length / tileColumnCount);
  }, [displayedSongs.length, tileColumnCount]);

  const tileVirtualizer = useVirtualizer({
    count: tileRowCount,
    getScrollElement: () => songListViewportRef.current,
    estimateSize: () => 220,
    gap: 16,
    overscan: 4,
  });

  const virtualTileRows = tileVirtualizer.getVirtualItems();
  const tileStartOffset =
    virtualTileRows.length > 0 ? virtualTileRows[0].start : 0;
  const tileEndOffset =
    virtualTileRows.length > 0
      ? tileVirtualizer.getTotalSize() -
        virtualTileRows[virtualTileRows.length - 1].end
      : 0;

  const currentSelectionKey = JSON.stringify({
    title: title.trim(),
    author: author.trim(),
    themes,
    slotCategories,
    songs: entries,
    ...settings,
  });
  const currentSelectionKeyRef = useRef(currentSelectionKey);
  currentSelectionKeyRef.current = currentSelectionKey;

  useEffect(() => {
    if (
      isGenerateLocked &&
      lockedSelectionKeyRef.current &&
      lockedSelectionKeyRef.current !== currentSelectionKey
    ) {
      setIsGenerateLocked(false);
      lockedSelectionKeyRef.current = null;
    }
  }, [isGenerateLocked, currentSelectionKey]);

  useEffect(() => {
    const updateWidth = () => setWindowWidth(window.innerWidth);
    updateWidth();

    window.addEventListener("resize", updateWidth);

    return () => {
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // topic付きURLだけ下書き・回答を復元する。新規アクセスでは保存済み下書きを変更しない。
  useEffect(() => {
    if (
      hasRestoredDraftRef.current ||
      !isDraftReady ||
      isLoading ||
      !topicState.ready ||
      topicState.error
    )
      return;
    hasRestoredDraftRef.current = true;
    if (topicState.topic) {
      const topic = topicState.topic;
      const source =
        draft?.topicId === topic.id
          ? normalizeSelection(draft, true)
          : topicState.response?.selection;
      setSettings(bestNineSettingsSnapshot(topic));
      setTitle(topic.title);
      setThemes(topic.themes);
      setSlotCategories(
        normalizeSlotCategories(topic.slotCategories) ?? emptySlotCategories(),
      );
      setAuthor(source?.author || "");
      setEntries(source?.songs ?? []);
      return;
    }
    const template = initialTemplateRef.current;
    if (template.themes === null) {
      showAppNotification({
        message: t("myBest9.themes.invalidUrl"),
        type: "warning",
      });
    }
    setTitle(template.title || t("myBest9.defaultTitle"));
  }, [
    draft,
    isDraftReady,
    isLoading,
    allSongs,
    t,
    topicState.ready,
    topicState.error,
    topicState.topic,
    topicState.response,
  ]);

  const saveSelection = (
    nextEntries = entries,
    nextThemes = themes,
    nextTitle = title,
    nextAuthor = author,
    nextSlotCategories = slotCategories,
    nextSettings = settings,
  ) => {
    const nextRestricted = hasCategoryRestrictions(
      nextSlotCategories.slice(0, nextSettings.songCount ?? 9),
    );
    const nextThemed =
      hasThemes(nextThemes.slice(0, nextSettings.songCount ?? 9)) ||
      nextRestricted;
    const songs = nextEntries.map((entry, index) => ({
      ...entry,
      slot: nextThemed ? (entry.slot ?? index) : undefined,
    }));
    setEntries(songs);
    saveDraft({
      ...bestNineSettingsSnapshot(nextSettings),
      title: nextTitle,
      author: nextAuthor,
      songs,
      ...(nextThemed ? { themes: nextThemes } : {}),
      ...(nextRestricted ? { slotCategories: nextSlotCategories } : {}),
      ...(topicState.topic
        ? {
            topicId: topicState.topic.id,
            topicVersion: topicState.topic.version,
          }
        : {}),
    });
    setGeneratedUrl("");
    setIsGenerateLocked(false);
    lockedSelectionKeyRef.current = null;
  };

  const applyThemes = (
    nextThemes: string[],
    deduplicate = false,
    nextSlotCategories = slotCategories,
  ) => {
    if (!topicState.topic?.canEdit || !topicState.editing) return;
    const nextSettings = {
      ...settings,
      allowedLiveIds: hasLiveSetlistCategory(nextSlotCategories, songCount)
        ? settings.allowedLiveIds
        : [],
    };
    let nextEntries = entries;
    const invalid = entries.filter((entry, index) => {
      const categories = nextSlotCategories[entry.slot ?? index];
      if (entry.kind === "live")
        return (
          !entry.snapshot ||
          !isBestNineLiveAllowed(
            entry.snapshot,
            categories,
            nextSettings.allowedLiveIds,
          )
        );
      const song = allSongs.find(
        (song) => song.video_id === entry.v && String(song.start) === entry.s,
      );
      return (
        !song ||
        !isBestNineVideoAllowed(
          song,
          categories,
          liveCatalog.choices,
          nextSettings.allowedLiveIds,
          allSongs,
        )
      );
    });
    if (invalid.length && !deduplicate) {
      setPendingDefinition({
        themes: nextThemes,
        slotCategories: nextSlotCategories,
        removeInvalid: true,
      });
      return;
    }
    if (invalid.length)
      nextEntries = entries.filter((entry) => !invalid.includes(entry));
    if (
      !hasThemes(nextThemes) &&
      !hasCategoryRestrictions(nextSlotCategories)
    ) {
      const seen = new Set<string>();
      const unique = nextEntries.filter((entry) => {
        const key = bestNineEntryKey(entry);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (unique.length !== entries.length && !deduplicate) {
        setPendingDefinition({
          themes: nextThemes,
          slotCategories: nextSlotCategories,
        });
        return;
      }
      nextEntries = unique;
    }
    setSettings(nextSettings);
    setThemes(nextThemes);
    setSlotCategories(nextSlotCategories);
    saveSelection(
      nextEntries,
      nextThemes,
      title,
      author,
      nextSlotCategories,
      nextSettings,
    );
    setPendingDefinition(null);
  };

  const addSong = (song: Song) => {
    if (
      !isBestNineVideoAllowed(
        song,
        activeCategories,
        liveCatalog.choices,
        settings.allowedLiveIds,
        allSongs,
      )
    )
      return;
    if (themed) {
      const nextEntries = entries.filter(
        (entry, index) => (entry.slot ?? index) !== activeSlot,
      );
      nextEntries.push({
        v: song.video_id,
        s: String(song.start),
        slot: activeSlot,
      });
      nextEntries.sort((a, b) => a.slot! - b.slot!);
      saveSelection(nextEntries);
      const nextSlot = Array.from(
        { length: songCount },
        (_, index) => (activeSlot + index + 1) % songCount,
      ).find((slot) => !nextEntries.some((entry) => entry.slot === slot));
      if (nextSlot !== undefined) setActiveSlot(nextSlot);
    } else if (
      entries.length < songCount &&
      !entries.some(
        (entry) => entry.v === song.video_id && entry.s === String(song.start),
      )
    ) {
      saveSelection([...entries, { v: song.video_id, s: String(song.start) }]);
    }
  };

  const addLiveSong = (choice: BestNineLiveChoice) => {
    if (
      !isBestNineLiveAllowed(choice, activeCategories, settings.allowedLiveIds)
    )
      return;
    const entry: MyBestNineSongsEntry = {
      kind: "live",
      liveId: choice.liveId,
      liveEntryKey: choice.entryKey,
      snapshot: choice,
    };
    if (themed) {
      const next = entries.filter(
        (item, index) => (item.slot ?? index) !== activeSlot,
      );
      next.push({ ...entry, slot: activeSlot });
      next.sort((a, b) => a.slot! - b.slot!);
      saveSelection(next);
      const emptySlot = Array.from(
        { length: songCount },
        (_, index) => (activeSlot + index + 1) % songCount,
      ).find((slot) => !next.some((item) => item.slot === slot));
      if (emptySlot !== undefined) setActiveSlot(emptySlot);
    } else {
      const exists = entries.some(
        (item) => bestNineEntryKey(item) === bestNineEntryKey(entry),
      );
      if (exists)
        saveSelection(
          entries.filter(
            (item) => bestNineEntryKey(item) !== bestNineEntryKey(entry),
          ),
        );
      else if (entries.length < songCount) saveSelection([...entries, entry]);
    }
  };

  const removeSong = (videoId: string, start: string) => {
    saveSelection(
      entries.filter((entry) => entry.v !== videoId || entry.s !== start),
    );
  };

  const handleTitleChange = (value: string) => {
    if (definitionLocked) return;
    setTitle(value);
    saveSelection(entries, themes, value);
  };

  const handleAuthorChange = (value: string) => {
    setAuthor(value);
    saveSelection(entries, themes, title, value);
  };

  // 共有URLを生成
  const handleGenerateUrl = async () => {
    if (!title.trim()) {
      showAppNotification({
        message: t("myBest9.alerts.titleRequired"),
        type: "warning",
      });
      return;
    }

    if (entries.length === 0) {
      showAppNotification({
        message: t("myBest9.alerts.selectAtLeastOne"),
        type: "warning",
      });
      return;
    }

    if (invalidSelection) return;

    const selection = {
      ...bestNineSettingsSnapshot(settings),
      title,
      author: author || undefined,
      songs: entries,
      ...(restricted ? { slotCategories } : {}),
      ...(themed ? { themes: themes.map((theme) => theme.trim()) } : {}),
      ...(topicState.topic
        ? {
            topicId: topicState.topic.id,
            topicVersion: topicState.topic.version,
          }
        : {}),
    };

    try {
      setIsSaving(true);
      const participant = await fetch(
        "/api/share/my-best-9-songs/participant",
        { method: "POST" },
      );
      if (!participant.ok)
        throw new Error(t("myBest9.topics.errors.SERVICE_UNAVAILABLE"));
      const response = await fetch("/api/share/my-best-9-songs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selection),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(
          errorData.error
            ? t(`myBest9.topics.errors.${errorData.error}`)
            : t("myBest9.alerts.saveFailed"),
        );
      }

      const data = (await response.json()) as { id: string };
      if (currentSelectionKeyRef.current !== currentSelectionKey) return;
      const sharePath = getPathname({
        locale,
        href: `/share/my-best-9-songs/${data.id}`,
      });
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}${sharePath}`;
      setGeneratedUrl(url);
      setIsGenerateLocked(true);
      lockedSelectionKeyRef.current = currentSelectionKey;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("myBest9.alerts.saveFailed");
      showAppNotification({ message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const xShareUrl = useMemo(() => {
    if (!generatedUrl) return "";
    const selectedTitles = slots.flatMap((slot) =>
      slot.live ? [slot.live.title] : slot.song ? [slot.song.title] : [],
    );
    const hashtags = [...new Set(["AZSongDB", ...(settings.hashtags ?? [])])]
      .map((tag) => `#${tag}`)
      .join(" ");
    const shareText = [
      author.trim() ? `${title.trim()} by ${author.trim()}` : title.trim(),
      selectedTitles.join("\n"),
      `${generatedUrl}\n${hashtags}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    const params = new URLSearchParams({
      text: shareText,
    });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [generatedUrl, title, author, entries, allSongs, settings]);

  const renderSelectedSongsSection = () => {
    if (!themed && !entries.length)
      return (
        <Text size="sm" c="dimmed" py="sm">
          {t("myBest9.selectionEmpty")}
        </Text>
      );
    return (
      <div>
        {themed && (
          <Text size="xs" c="dimmed" mb="xs">
            {t("myBest9.themes.slotsTitle")}
          </Text>
        )}
        {(themed ? slots : slots.filter((slot) => slot.entry)).map(
          ({ slot, theme, song, live, entry }) => (
            <div
              key={slot}
              className={themed ? styles.slot : styles.selectedRow}
              data-active={(themed && activeSlot === slot) || undefined}
            >
              <button
                type="button"
                aria-pressed={themed ? activeSlot === slot : undefined}
                onClick={() => themed && setActiveSlot(slot)}
                className={styles.slotButton}
              >
                <span className={styles.number}>{slot + 1}.</span>
                <div className={styles.selectedInfo}>
                  {themed && (
                    <Text size="xs" fw={600}>
                      {theme || t("myBest9.themes.freeSlot")}
                    </Text>
                  )}
                  {song && (
                    <div className={styles.selectedThumb}>
                      <YoutubeThumbnail
                        videoId={song.video_id}
                        alt={song.title}
                      />
                    </div>
                  )}
                  <Text size="sm" fw={500}>
                    {song?.title ||
                      (locale === "en"
                        ? live?.titleEn || live?.title
                        : live?.title) ||
                      t(
                        entry
                          ? "myBest9.themes.missingSong"
                          : "myBest9.themes.chooseSong",
                      )}
                  </Text>
                  {(song || live) && (
                    <Text size="xs" c="dimmed">
                      {live
                        ? `${live.liveTitle} / ${live.singers}`
                        : song?.artist}
                    </Text>
                  )}
                </div>
              </button>
              {song && (
                <Tooltip label={t("myBest9.play")}>
                  <ActionIcon
                    size="sm"
                    color="gray"
                    variant="subtle"
                    aria-label={t("myBest9.previewSong", { title: song.title })}
                    onClick={() => handlePreviewSong(song)}
                  >
                    <FaPlay size={11} />
                  </ActionIcon>
                </Tooltip>
              )}
              {entry && (
                <Tooltip label={t("myBest9.themes.remove")}>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    aria-label={
                      themed
                        ? t("myBest9.themes.removeSlot", { number: slot + 1 })
                        : t("myBest9.removeSong", {
                            title: song?.title ?? live?.title ?? "",
                          })
                    }
                    onClick={() => {
                      saveSelection(
                        entries.filter(
                          (item, index) => (item.slot ?? index) !== slot,
                        ),
                      );
                      if (themed) setActiveSlot(slot);
                    }}
                  >
                    <HiX size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
            </div>
          ),
        )}
      </div>
    );
  };

  return (
    <div className={pageClasses.shellFlushBottom}>
      {createOpened && (
        <BestNineTopicCreateModal
          opened
          onClose={() => setCreateOpened(false)}
          onCreate={(definition) => topicState.persist(definition, false)}
          saving={topicState.saving}
          status={topicState.status}
        />
      )}
      <Modal
        opened={pendingSettings !== null}
        onClose={() => setPendingSettings(null)}
        title={t("myBest9.settings.confirmTitle")}
        centered
      >
        <Text size="sm">{t("myBest9.settings.confirmDescription")}</Text>
        <Group justify="flex-end" mt="md">
          <MantineButton
            variant="default"
            onClick={() => setPendingSettings(null)}
          >
            {t("myBest9.themes.cancel")}
          </MantineButton>
          <MantineButton
            onClick={() =>
              pendingSettings && applySettings(pendingSettings, true)
            }
          >
            {t("myBest9.themes.confirm")}
          </MantineButton>
        </Group>
      </Modal>
      <Modal
        opened={pendingDefinition !== null}
        onClose={() => setPendingDefinition(null)}
        title={t("myBest9.themes.confirmTitle")}
        centered
      >
        <Text size="sm">
          {t(
            pendingDefinition?.removeInvalid
              ? "myBest9.settings.confirmDescription"
              : "myBest9.themes.confirmDescription",
          )}
        </Text>
        <Group justify="flex-end" mt="md">
          <MantineButton
            variant="default"
            onClick={() => setPendingDefinition(null)}
          >
            {t("myBest9.themes.cancel")}
          </MantineButton>
          <MantineButton
            color="pink"
            onClick={() =>
              pendingDefinition &&
              applyThemes(
                pendingDefinition.themes,
                true,
                pendingDefinition.slotCategories,
              )
            }
          >
            {t("myBest9.themes.confirm")}
          </MantineButton>
        </Group>
      </Modal>
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> {dm("home")}
        </Link>
        <Link href="/share" className={breadcrumbClasses.link}>
          {t("index.title")}
        </Link>
        <span className={breadcrumbClasses.link}>{t("myBest9.pageTitle")}</span>
      </Breadcrumbs>

      <div className={styles.header}>
        <div>
          <h1 className={pageClasses.heading}>{t("myBest9.pageTitle")}</h1>
          <p className={styles.description}>{t("myBest9.lead")}</p>
        </div>
        <Group gap="xs">
          <MantineButton
            component={Link}
            href="/share/my-best-9-songs/topics"
            variant="default"
            size="sm"
          >
            {t("myBest9.topics.manage")}
          </MantineButton>
          <MantineButton
            variant="filled"
            size="sm"
            onClick={() => setCreateOpened(true)}
          >
            {t("myBest9.topics.create")}
          </MantineButton>
        </Group>
      </div>

      {/* メインコンテンツ */}
      <div className="pb-4">
        <Grid gap={{ base: "lg", md: 32 }}>
          {/* 左側：入力フォーム */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <div className={styles.sidebar}>
              <Stack gap="md">
                {/* タイトル入力 */}
                <div>
                  <TextInput
                    label={t("myBest9.form.titleLabel")}
                    placeholder={t("myBest9.form.titlePlaceholder")}
                    value={title}
                    onChange={(e) => handleTitleChange(e.currentTarget.value)}
                    maxLength={50}
                    required
                    readOnly={definitionLocked}
                  />
                  {topicState.topic && (
                    <Tooltip
                      label={
                        copiedThemeUrl
                          ? t("copied")
                          : t("myBest9.tooltip.copyThemeUrl")
                      }
                    >
                      <MantineButton
                        size="xs"
                        variant="subtle"
                        color="blue"
                        leftSection={<MdContentCopy size={14} />}
                        onClick={async () => {
                          const themePath = getPathname({
                            locale,
                            href: "/share/my-best-9-songs",
                          });
                          await navigator.clipboard.writeText(
                            `${window.location.origin}${themePath}?topic=${topicState.topic!.id}`,
                          );
                          setCopiedThemeUrl(true);
                          setTimeout(() => setCopiedThemeUrl(false), 2000);
                        }}
                      >
                        {copiedThemeUrl
                          ? t("copied")
                          : t("myBest9.button.copyThemeUrl")}
                      </MantineButton>
                    </Tooltip>
                  )}
                </div>

                {/* 作成者名入力 */}
                <div>
                  <TextInput
                    label={t("myBest9.form.authorLabel")}
                    placeholder={t("myBest9.form.authorPlaceholder")}
                    value={author}
                    onChange={(e) => handleAuthorChange(e.currentTarget.value)}
                    maxLength={30}
                  />
                </div>

                {topicState.topic && (
                  <div>
                    <Text size="xs" c="dimmed">
                      {t("myBest9.topics.registered")}
                    </Text>
                    <Group gap="xs" mt="xs">
                      {topicState.topic.canEdit && !topicState.editing && (
                        <MantineButton
                          size="xs"
                          variant="light"
                          onClick={() => {
                            beforeEditRef.current = {
                              title,
                              themes,
                              entries,
                              slotCategories,
                              settings,
                            };
                            topicState.setEditing(true);
                          }}
                        >
                          {t("myBest9.topics.edit")}
                        </MantineButton>
                      )}
                      {topicState.topic.canViewResults && (
                        <MantineButton
                          component={Link}
                          href={`/share/my-best-9-songs/topics/${topicState.topic.id}/results`}
                          size="xs"
                          variant="light"
                        >
                          {t("myBest9.topics.results")}
                        </MantineButton>
                      )}
                    </Group>
                    {topicState.editing && (
                      <Stack gap="xs" mt="xs">
                        <Text size="xs">
                          {t("myBest9.topics.revisionHelp")}
                        </Text>
                        <Group gap="xs">
                          <MantineButton
                            size="xs"
                            loading={topicState.saving}
                            disabled={!title.trim()}
                            onClick={() =>
                              topicState.persist({
                                title,
                                themes,
                                slotCategories,
                                ...settings,
                              })
                            }
                          >
                            {t("myBest9.topics.saveRevision")}
                          </MantineButton>
                          <MantineButton
                            size="xs"
                            variant="default"
                            onClick={() => {
                              if (beforeEditRef.current) {
                                setSettings(beforeEditRef.current.settings);
                                setTitle(beforeEditRef.current.title);
                                setThemes(beforeEditRef.current.themes);
                                setSlotCategories(
                                  beforeEditRef.current.slotCategories,
                                );
                                setEntries(beforeEditRef.current.entries);
                                saveSelection(
                                  beforeEditRef.current.entries,
                                  beforeEditRef.current.themes,
                                  beforeEditRef.current.title,
                                  author,
                                  beforeEditRef.current.slotCategories,
                                  beforeEditRef.current.settings,
                                );
                              }
                              topicState.setEditing(false);
                            }}
                          >
                            {t("myBest9.themes.cancel")}
                          </MantineButton>
                        </Group>
                      </Stack>
                    )}
                  </div>
                )}
                {topicState.error && (
                  <Alert color="red">
                    {t(`myBest9.topics.errors.${topicState.error}`)}
                  </Alert>
                )}
                {topicId && !topicState.ready && (
                  <Text size="sm">{t("share.loading")}</Text>
                )}
                {topicState.topic?.canEdit && topicState.editing && (
                  <BestNineSettingsFields
                    value={settings}
                    onChange={applySettings}
                    disabled={definitionLocked}
                  />
                )}
                {topicState.topic?.canEdit && topicState.editing && (
                  <Accordion variant="contained">
                    <Accordion.Item value="slot-themes">
                      <Accordion.Control>
                        {t("myBest9.themes.heading")}
                      </Accordion.Control>
                      <Accordion.Panel>
                        <BestNineThemeFields
                          themes={themes}
                          songCount={songCount}
                          onChange={applyThemes}
                          slotCategories={slotCategories}
                          onCategoriesChange={(categories) =>
                            applyThemes(themes, false, categories)
                          }
                          readOnly={definitionLocked}
                        />
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                )}

                {topicState.topic?.canEdit &&
                  topicState.editing &&
                  hasLiveSetlistCategory(slotCategories, songCount) && (
                    <BestNineLivePerformanceField
                      value={settings.allowedLiveIds ?? []}
                      onChange={(allowedLiveIds) =>
                        applySettings({ ...settings, allowedLiveIds })
                      }
                      disabled={definitionLocked}
                    />
                  )}

                <div className={styles.selection}>
                  <div className={styles.selectionHeader}>
                    <Text component="h2" size="sm" fw={600}>
                      {t("myBest9.selectedSongsTitle")}
                    </Text>
                    <span
                      className={styles.selectionCount}
                      aria-label={t("myBest9.selectedCount", {
                        count: entries.length,
                        max: songCount,
                      })}
                    >
                      {entries.length} / {songCount}
                    </span>
                  </div>
                  {renderSelectedSongsSection()}
                </div>

                {/* URLのコピーボタン */}
                {generatedUrl && (
                  <div>
                    <Text size="sm" fw={500} mb={8}>
                      {t("myBest9.generatedUrlTitle")}
                    </Text>
                    <Group grow>
                      <TextInput readOnly value={generatedUrl} />
                      <Tooltip
                        label={
                          copied
                            ? t("copied")
                            : t("myBest9.tooltip.copyToClipboard")
                        }
                      >
                        <MantineButton
                          rightSection={<MdContentCopy />}
                          onClick={() => {
                            navigator.clipboard.writeText(generatedUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          variant="light"
                          size="sm"
                        >
                          {t("myBest9.button.copy")}
                        </MantineButton>
                      </Tooltip>
                    </Group>
                    <MantineButton
                      mt="xs"
                      component="a"
                      href={xShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="dark"
                      fullWidth
                    >
                      {t("myBest9.button.shareOnX")}
                    </MantineButton>
                  </div>
                )}

                {!!overflowEntries.length && (
                  <Alert color="red">
                    {t("myBest9.settings.overLimit", { count: songCount })}
                  </Alert>
                )}
                {!!invalidSlots.length && (
                  <Text size="sm" c="red">
                    {t("myBest9.topics.disallowedSelection", {
                      slots: invalidSlots
                        .map((slot) => slot.slot + 1)
                        .join(", "),
                    })}
                  </Text>
                )}
                {/* メインボタン */}
                <MantineButton
                  onClick={handleGenerateUrl}
                  disabled={
                    !title.trim() ||
                    !!topicState.error ||
                    !topicState.ready ||
                    topicState.editing ||
                    invalidSelection ||
                    entries.length === 0 ||
                    isSaving ||
                    isGenerateLocked
                  }
                  fullWidth
                  size="sm"
                >
                  {isSaving
                    ? t("myBest9.button.saving")
                    : isGenerateLocked
                      ? t("myBest9.button.generated")
                      : t("myBest9.button.generate")}
                </MantineButton>

                {/* ドラフト削除 */}
                <MantineButton
                  onClick={() => {
                    setTitle(
                      topicState.topic?.title ?? t("myBest9.defaultTitle"),
                    );
                    setAuthor("");
                    setEntries([]);
                    setThemes(topicState.topic?.themes ?? emptyThemes());
                    setActiveSlot(0);
                    clearDraft();
                    setGeneratedUrl("");
                    setIsGenerateLocked(false);
                    lockedSelectionKeyRef.current = null;
                  }}
                  variant="subtle"
                  color="gray"
                  size="xs"
                  fullWidth
                >
                  {t("myBest9.button.reset")}
                </MantineButton>

                <Text size="xs" c="dimmed">
                  {t("myBest9.settings.selectionHelp", { count: songCount })}
                </Text>
              </Stack>
            </div>
          </Grid.Col>

          {/* 右側：曲選択 */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <div>
              <Stack gap="md">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {t("myBest9.browseSongsTitle")}
                  </h2>
                </div>

                {themed && (
                  <Text role="status" size="sm" fw={600} c="pink">
                    {t("myBest9.themes.activeSlot", {
                      number: activeSlot + 1,
                      theme: themes[activeSlot] || t("myBest9.themes.freeSlot"),
                    })}
                  </Text>
                )}

                {themed && (
                  <Text size="xs" c="dimmed">
                    {t("myBest9.topics.currentCategories", {
                      categories: activeCategories
                        .map((category) =>
                          t(
                            `myBest9.filters.${bestNineCategoryLabel[category]}`,
                          ),
                        )
                        .join("・"),
                    })}
                  </Text>
                )}
                {/* 利用可能な曲のリスト */}
                <div>
                  <Group
                    gap={4}
                    className={styles.filters}
                    aria-label={t("myBest9.filterLabel")}
                  >
                    {BEST_NINE_CATEGORIES.filter(
                      (category) =>
                        category === "all" ||
                        activeCategories.includes("all") ||
                        activeCategories.includes(category),
                    ).map((value) => (
                      <MantineButton
                        key={value}
                        size="compact-sm"
                        color="gray"
                        variant="subtle"
                        className={styles.filter}
                        data-active={effectiveFilter === value || undefined}
                        aria-pressed={effectiveFilter === value}
                        onClick={() => {
                          setActiveFilter(value);
                        }}
                      >
                        {t(`myBest9.filters.${bestNineCategoryLabel[value]}`)}
                      </MantineButton>
                    ))}
                  </Group>
                  {needsLiveCatalog && (
                    <>
                      {liveCatalog.error && (
                        <Alert color="red">
                          {t("myBest9.settings.liveError")}
                        </Alert>
                      )}
                      <Select
                        label={t("myBest9.settings.browsePerformance")}
                        mb="sm"
                        placeholder={t("myBest9.settings.allPerformances")}
                        clearable
                        searchable
                        value={browseLiveId}
                        data={[
                          ...new Map(
                            scopedLiveChoices.map((choice) => [
                              choice.liveId,
                              {
                                value: choice.liveId,
                                label: [
                                  choice.liveTitle,
                                  choice.performance,
                                  choice.date,
                                ]
                                  .filter(Boolean)
                                  .join(" / "),
                              },
                            ]),
                          ).values(),
                        ]}
                        onChange={(id) => {
                          setBrowseLiveId(id);
                        }}
                      />
                    </>
                  )}
                  <TextInput
                    aria-label={t("myBest9.search.placeholder")}
                    placeholder={t("myBest9.search.placeholder")}
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.currentTarget.value)}
                    leftSection={<HiSearch />}
                    mb={8}
                  />
                  {liveSelectionMode ? (
                    isLoading || liveCatalog.loading ? (
                      <Skeleton height={160} />
                    ) : (
                      <BestNineLiveSelector
                        choices={performanceLiveChoices.filter(
                          (choice) =>
                            isBestNineLiveAllowed(
                              choice,
                              activeCategories,
                              settings.allowedLiveIds,
                            ) &&
                            [
                              choice.title,
                              choice.titleEn,
                              choice.artist,
                              choice.singers,
                              choice.liveTitle,
                            ]
                              .join(" ")
                              .normalize("NFKC")
                              .toLowerCase()
                              .includes(
                                songSearchQuery
                                  .trim()
                                  .normalize("NFKC")
                                  .toLowerCase(),
                              ),
                        )}
                        recordings={liveRecordings}
                        selectedKeys={
                          new Set(
                            performanceLiveChoices
                              .filter((choice) => {
                                const recording = liveRecordings.get(
                                  bestNineLiveChoiceKey(choice),
                                );
                                return entries.some((entry) =>
                                  entry.kind === "live"
                                    ? entry.liveId === choice.liveId &&
                                      entry.liveEntryKey === choice.entryKey
                                    : recording?.video_id === entry.v &&
                                      Number(recording.start) ===
                                        Number(entry.s),
                                );
                              })
                              .map(bestNineLiveChoiceKey),
                          )
                        }
                        canAdd={themed || entries.length < songCount}
                        onSelect={(choice, recording) => {
                          if (!themed) {
                            const selected = entries.filter((entry) =>
                              entry.kind === "live"
                                ? entry.liveId === choice.liveId &&
                                  entry.liveEntryKey === choice.entryKey
                                : recording?.video_id === entry.v &&
                                  Number(recording.start) === Number(entry.s),
                            );
                            if (selected.length) {
                              saveSelection(
                                entries.filter(
                                  (entry) => !selected.includes(entry),
                                ),
                              );
                              return;
                            }
                          }
                          if (recording) addSong(recording);
                          else addLiveSong(choice);
                        }}
                      />
                    )
                  ) : (
                    <>
                      <Text size="sm" c="dimmed" mb={8}>
                        {t("myBest9.displaying", {
                          count: displayedSongs.length,
                        })}
                        {songSearchQuery.trim() &&
                          ` / ${uniqueCategorySongs.length} ${t("myBest9.totalSuffix")}`}
                      </Text>
                      <div className="h-95 lg:h-[calc(100dvh-280px)] min-h-95">
                        {isLoading ? (
                          <div
                            className="grid gap-x-3 gap-y-4 pr-2"
                            style={{
                              gridTemplateColumns: `repeat(${tileColumnCount}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: 12 }).map((_, index) => (
                              <article
                                key={`song-skeleton-${index}-${activeFilter}`}
                                className="overflow-hidden rounded"
                              >
                                <Skeleton height={80} radius={0} />
                                <div className="p-2">
                                  <Skeleton height={14} mb={6} radius="sm" />
                                  <Skeleton
                                    height={10}
                                    width="70%"
                                    radius="sm"
                                  />
                                </div>
                              </article>
                            ))}
                          </div>
                        ) : (
                          <ScrollArea
                            h="100%"
                            viewportRef={songListViewportRef}
                          >
                            <div style={{ height: `${tileStartOffset}px` }} />

                            <div
                              className="grid gap-x-3 gap-y-4 pr-2"
                              style={{
                                gridTemplateColumns: `repeat(${tileColumnCount}, minmax(0, 1fr))`,
                              }}
                            >
                              {virtualTileRows.flatMap((virtualRow) => {
                                const startItemIndex =
                                  virtualRow.index * tileColumnCount;
                                const rowItems = displayedSongs.slice(
                                  startItemIndex,
                                  startItemIndex + tileColumnCount,
                                );

                                return rowItems.map((song, itemIndexInRow) => {
                                  const isSelected = selectedSongs.find(
                                    (s) =>
                                      s.video_id === song.video_id &&
                                      s.start === song.start,
                                  );
                                  const isDisabled =
                                    !themed &&
                                    entries.length >= songCount &&
                                    !isSelected;

                                  return (
                                    <article
                                      key={`${virtualRow.key}-${song.video_id}-${song.start}-${itemIndexInRow}`}
                                      role="button"
                                      tabIndex={isDisabled ? -1 : 0}
                                      aria-disabled={isDisabled}
                                      aria-pressed={!!isSelected}
                                      data-selected={!!isSelected || undefined}
                                      aria-label={t(
                                        "myBest9.themes.selectSong",
                                        {
                                          title: song.title,
                                        },
                                      )}
                                      onKeyDown={(event) => {
                                        if (
                                          event.target !==
                                            event.currentTarget ||
                                          (event.key !== "Enter" &&
                                            event.key !== " ")
                                        )
                                          return;
                                        event.preventDefault();
                                        if (
                                          themed ||
                                          (!isSelected && !isDisabled)
                                        )
                                          addSong(song);
                                        else if (isSelected)
                                          removeSong(
                                            song.video_id,
                                            String(song.start),
                                          );
                                      }}
                                      ref={
                                        itemIndexInRow === 0
                                          ? tileVirtualizer.measureElement
                                          : undefined
                                      }
                                      data-index={
                                        itemIndexInRow === 0
                                          ? virtualRow.index
                                          : undefined
                                      }
                                      onClick={() => {
                                        if (
                                          themed ||
                                          (!isSelected && !isDisabled)
                                        ) {
                                          addSong(song);
                                        } else if (isSelected) {
                                          removeSong(
                                            song.video_id,
                                            String(song.start),
                                          );
                                        }
                                      }}
                                      className={styles.songCard}
                                    >
                                      <div className={styles.thumbnail}>
                                        <YoutubeThumbnail
                                          videoId={song.video_id}
                                          alt={song.title}
                                        />
                                        {isSelected && (
                                          <span
                                            className={styles.selectedCheck}
                                            aria-hidden="true"
                                          >
                                            <HiCheck size={15} />
                                          </span>
                                        )}
                                      </div>
                                      <div className={styles.songDetails}>
                                        <Text
                                          truncate
                                          className={styles.songTitle}
                                        >
                                          {song.title}
                                        </Text>
                                        <Text size="xs" c="dimmed" truncate>
                                          {song.artist}
                                        </Text>
                                        <div className={styles.songFooter}>
                                          <Text size="xs" c="dimmed">
                                            {formatBroadcastDate(
                                              song.broadcast_at,
                                              locale,
                                              t,
                                            )}
                                          </Text>
                                          <Tooltip label={t("myBest9.play")}>
                                            <ActionIcon
                                              size="sm"
                                              color="gray"
                                              variant="subtle"
                                              aria-label={t(
                                                "myBest9.previewSong",
                                                {
                                                  title: song.title,
                                                },
                                              )}
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                handlePreviewSong(song);
                                              }}
                                            >
                                              <FaPlay size={11} />
                                            </ActionIcon>
                                          </Tooltip>
                                        </div>
                                      </div>
                                    </article>
                                  );
                                });
                              })}
                            </div>

                            <div style={{ height: `${tileEndOffset}px` }} />
                          </ScrollArea>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Stack>
            </div>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}
