"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  TextInput,
  Button as MantineButton,
  Stack,
  ScrollArea,
  Tooltip,
  Group,
  Progress,
  Text,
  Badge,
  Grid,
  Paper,
  Skeleton,
  Breadcrumbs,
} from "@mantine/core";
import { MdContentCopy } from "react-icons/md";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Song } from "../../types/song";
import useMyBestNineSongsDraft from "../../hook/useMyBestNineSongsDraft";
import useSearch from "../../hook/useSearch";
import {
  isPossibleOriginalSong,
  isCoverSong,
  isCollaborationSong,
} from "../../config/filters";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import useSongs from "../../hook/useSongs";
import { HiChevronRight, HiHome, HiSearch } from "react-icons/hi";
import { breadcrumbClasses } from "@/app/theme";
import { Link, getPathname } from "@/i18n/navigation";
import { useGlobalPlayer } from "../../hook/useGlobalPlayer";
import { FaPlay } from "react-icons/fa6";

type SongCategoryFilter =
  | "all"
  | "original"
  | "cover"
  | "unit-guest"
  | "live-singing"
  | "collaboration";

const normalizeStart = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const withoutSuffix = trimmed.replace(/s$/i, "");
  const numeric = Number(withoutSuffix);
  if (Number.isFinite(numeric)) {
    return String(numeric);
  }
  return withoutSuffix;
};

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
 * オリジナル曲とカバー曲から最大9曲を選んで、共有URLを生成
 */
export default function MyBestNineSongsPage() {
  const searchParams = useSearchParams();
  const queryTitle = useMemo(() => {
    const raw = searchParams.get("title");
    if (!raw) return null;
    const normalized = raw.trim();
    if (!normalized) return null;
    return normalized.slice(0, 50);
  }, [searchParams]);

  // 初回ロード時のqueryTitleをrefに保持し、以降の再レンダリングで上書きされないようにする
  const initialQueryTitleRef = useRef(queryTitle);
  // ドラフト復元を1回のみ実行するフラグ
  const hasRestoredDraftRef = useRef(false);

  const [activeFilter, setActiveFilter] = useState<SongCategoryFilter>("all");
  const [title, setTitle] = useState(() => queryTitle || "");
  const [author, setAuthor] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedThemeUrl, setCopiedThemeUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerateLocked, setIsGenerateLocked] = useState(false);
  const lockedSelectionKeyRef = useRef<string | null>(null);
  const songListViewportRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(0);

  const { draft, saveDraft, clearDraft } = useMyBestNineSongsDraft();
  const { allSongs, isLoading } = useSongs();
  const locale = useLocale();
  const t = useTranslations("Share");
  const dm = useTranslations("DrawerMenu");
  const { setCurrentSong, setCurrentTime, setIsPlaying, setIsMinimized } =
    useGlobalPlayer();

  const handlePreviewSong = (song: Song) => {
    setCurrentSong(song);
    setCurrentTime(Number(song.start));
    setIsMinimized(true);
    setIsPlaying(true);
  };

  const isUnitOrGuestSong = (song: Song) => {
    return isCollaborationSong(song);
  };

  const isLiveSingSong = (song: Song) => {
    return song.tags.includes("歌枠");
  };

  const hasTag = (song: Song, value: string) => {
    const normalizedValue = value.toLowerCase();
    return song.tags
      .join(",")
      .toLowerCase()
      .split(",")
      .some((tag) => tag.includes(normalizedValue));
  };

  // 選択対象の全候補
  const selectableSongs = allSongs;

  // カテゴリーフィルター済みの曲（activeFilterに応じて絞り込み）
  const categoryFilteredSongs = useMemo(() => {
    if (activeFilter === "all") {
      return selectableSongs;
    }

    if (activeFilter === "original") {
      return selectableSongs.filter((song) => isPossibleOriginalSong(song));
    }

    if (activeFilter === "cover") {
      return selectableSongs.filter((song) => isCoverSong(song));
    }

    if (activeFilter === "live-singing") {
      return selectableSongs.filter((song) => song.tags.includes("歌枠"));
    }

    if (activeFilter === "collaboration") {
      return selectableSongs.filter((song) => hasTag(song, "コラボ"));
    }

    return selectableSongs.filter((song) => isUnitOrGuestSong(song));
  }, [activeFilter, selectableSongs]);

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

  // タイル一覧の表示幅から列数を計算（base:2, lg:3, xl:4）
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

  const currentSelectionKey = useMemo(() => {
    const songsKey = selectedSongs
      .map((song) => `${song.video_id}:${String(song.start)}`)
      .join(",");
    return `${title.trim()}|${author.trim()}|${songsKey}`;
  }, [title, author, selectedSongs]);

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

  // ドラフトを復元（初回のみ実行。URLのtitleパラメータは初回ロード時の値のみ使用する）
  useEffect(() => {
    if (hasRestoredDraftRef.current) return;
    if (draft && allSongs.length > 0) {
      hasRestoredDraftRef.current = true;
      setTitle(
        initialQueryTitleRef.current ||
          draft.title ||
          t("myBest9.defaultTitle"),
      );
      setAuthor(draft.author || "");

      // ドラフトの曲を復元
      const draftSongs = draft.songs
        .map((entry) => {
          const normalizedEntryStart = normalizeStart(entry.s);
          if (!normalizedEntryStart) return undefined;

          const exact = allSongs.find((s) => {
            const normalizedSongStart = normalizeStart(s.start);
            return (
              s.video_id === entry.v &&
              normalizedSongStart !== null &&
              normalizedSongStart === normalizedEntryStart
            );
          });
          if (exact) return exact;

          const sameVideoSongs = allSongs.filter((s) => s.video_id === entry.v);
          if (sameVideoSongs.length === 1) {
            return sameVideoSongs[0];
          }

          return undefined;
        })
        .filter((s): s is Song => s !== undefined);

      setSelectedSongs(draftSongs);
    }
  }, [draft, allSongs]);

  // 曲を選択に追加
  const addSong = (song: Song) => {
    if (
      selectedSongs.length < 9 &&
      !selectedSongs.find(
        (s) => s.video_id === song.video_id && s.start === song.start,
      )
    ) {
      const newSelected = [...selectedSongs, song];
      setSelectedSongs(newSelected);
      const songEntries = newSelected.map((s) => ({
        v: s.video_id,
        s: String(s.start),
      }));
      saveDraft({ title, author, songs: songEntries });
    }
  };

  // 曲を選択から削除
  const removeSong = (videoId: string, start: string) => {
    const newSelected = selectedSongs.filter(
      (s) => !(s.video_id === videoId && String(s.start) === start),
    );
    setSelectedSongs(newSelected);
    const songEntries = newSelected.map((s) => ({
      v: s.video_id,
      s: String(s.start),
    }));
    saveDraft({ title, author, songs: songEntries });
  };

  // タイトル変更時に自動保存
  const handleTitleChange = (value: string) => {
    setTitle(value);
    const songEntries = selectedSongs.map((s) => ({
      v: s.video_id,
      s: String(s.start),
    }));
    saveDraft({ title: value, author, songs: songEntries });
  };

  // 作成者名変更時に自動保存
  const handleAuthorChange = (value: string) => {
    setAuthor(value);
    const songEntries = selectedSongs.map((s) => ({
      v: s.video_id,
      s: String(s.start),
    }));
    saveDraft({ title, author: value, songs: songEntries });
  };

  // 共有URLを生成
  const handleGenerateUrl = async () => {
    if (!title.trim()) {
      alert(t("myBest9.alerts.titleRequired"));
      return;
    }

    if (selectedSongs.length === 0) {
      alert(t("myBest9.alerts.selectAtLeastOne"));
      return;
    }

    // 曲データを圧縮形式に変換
    const songEntries = selectedSongs.map((song) => ({
      v: song.video_id,
      s: String(song.start),
    }));

    const selection = {
      title,
      author: author || undefined,
      songs: songEntries,
    };

    try {
      setIsSaving(true);
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
        throw new Error(errorData.error || t("myBest9.alerts.saveFailed"));
      }

      const data = (await response.json()) as { id: string };
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
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  const isFilled = selectedSongs.length > 0;
  const filledPercentage = (selectedSongs.length / 9) * 100;

  const xShareUrl = useMemo(() => {
    if (!generatedUrl) return "";
    const shareText = author.trim()
      ? `${title.trim()} by ${author.trim()}`
      : title.trim();
    const params = new URLSearchParams({
      text: shareText,
      url: generatedUrl,
      hashtags: "AZSongDB",
    });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [generatedUrl, title, author]);

  const renderSelectedSongsSection = (gridClassName: string) => {
    if (selectedSongs.length === 0) {
      return null;
    }

    return (
      <div className="mb-4">
        <Text size="sm" fw={500} mb={8}>
          {t("myBest9.selectedSongsTitle")}
        </Text>
        <div className={gridClassName}>
          {selectedSongs.map((song) => (
            <div
              key={`${song.video_id}-${song.start}`}
              className="relative cursor-pointer rounded overflow-hidden border border-pink-300 bg-pink-50 shadow-sm transition hover:bg-pink-100 dark:border-pink-700 dark:bg-gray-800 dark:hover:bg-pink-900/20"
              onClick={() => removeSong(song.video_id, String(song.start))}
            >
              <div className="w-full aspect-video bg-black">
                <YoutubeThumbnail
                  videoId={song.video_id}
                  alt={song.title}
                  fill={true}
                />
              </div>
              <div className="p-3 pt-2">
                <Text size="xs" truncate className="font-bold">
                  {song.title}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {song.artist}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {formatBroadcastDate(song.broadcast_at, locale, t)}
                </Text>
                <MantineButton
                  size="compact-xs"
                  color="pink"
                  variant="light"
                  className="inline-flex mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewSong(song);
                  }}
                >
                  <FaPlay className="mr-1" />
                  {t("myBest9.play")}
                </MantineButton>
                <Text size="xs" c="dimmed" mt={2}>
                  {t("myBest9.clickToRemove")}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto">
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

      <div>
        <h1 className="font-extrabold text-2xl p-3">
          {t("myBest9.pageTitle")}
        </h1>
        <div className="p-3">
          <p className="text-sm text-gray-600 dark:text-light-gray-400">
            {t("myBest9.lead")}
          </p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="px-3 pb-4">
        <Grid gutter="lg">
          {/* 左側：入力フォーム */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="lg" radius="md" withBorder>
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
                  />
                  <Text size="xs" c="dimmed" mt={4}>
                    {title.length}/50
                  </Text>
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
                      onClick={() => {
                        const themePath = getPathname({
                          locale,
                          href: "/share/my-best-9-songs",
                        });
                        const themeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${themePath}?title=${encodeURIComponent(title.trim())}`;
                        navigator.clipboard.writeText(themeUrl);
                        setCopiedThemeUrl(true);
                        setTimeout(() => setCopiedThemeUrl(false), 2000);
                      }}
                      disabled={!title.trim()}
                    >
                      {copiedThemeUrl
                        ? t("copied")
                        : t("myBest9.button.copyThemeUrl")}
                    </MantineButton>
                  </Tooltip>
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
                  <Text size="xs" c="dimmed" mt={4}>
                    {author.length}/30
                  </Text>
                </div>

                {/* 選択状況 */}
                <div>
                  <Group justify="space-between" mb={8}>
                    <Text fw={500}>
                      {t("myBest9.selectedCount", {
                        count: selectedSongs.length,
                      })}
                    </Text>
                    <Badge
                      size="sm"
                      variant="dot"
                      color={isFilled ? "green" : "gray"}
                    >
                      {isFilled
                        ? t("myBest9.status.selected")
                        : t("myBest9.status.unselected")}
                    </Badge>
                  </Group>
                  <Progress value={filledPercentage} color="pink" />
                </div>

                {/* URLのコピーボタン */}
                {generatedUrl && (
                  <div>
                    <Text size="sm" fw={500} mb={8}>
                      {t("myBest9.generatedUrlTitle")}
                    </Text>
                    <Group grow>
                      <input
                        type="text"
                        readOnly
                        value={generatedUrl}
                        className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
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

                {/* メインボタン */}
                <MantineButton
                  onClick={handleGenerateUrl}
                  disabled={
                    !title.trim() ||
                    selectedSongs.length === 0 ||
                    isSaving ||
                    isGenerateLocked
                  }
                  fullWidth
                  color="pink"
                  size="md"
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
                    setTitle(t("myBest9.defaultTitle"));
                    setAuthor("");
                    setSelectedSongs([]);
                    clearDraft();
                    setGeneratedUrl("");
                    setIsGenerateLocked(false);
                    lockedSelectionKeyRef.current = null;
                  }}
                  variant="light"
                  color="red"
                  fullWidth
                >
                  {t("myBest9.button.reset")}
                </MantineButton>

                {/* TIP */}
                <Paper
                  p="sm"
                  radius="sm"
                  withBorder
                  className="border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/25"
                >
                  <Text
                    size="xs"
                    className="leading-relaxed text-blue-900 dark:text-blue-100"
                  >
                    💡 {t("myBest9.tip.previewHelp")}
                  </Text>
                </Paper>
              </Stack>
            </Paper>

            {/* PC表示では選択済み曲を左下に表示 */}
            <div className="hidden lg:block mt-4">
              {renderSelectedSongsSection(
                "grid grid-cols-2 xl:grid-cols-3 gap-2",
              )}
            </div>
          </Grid.Col>

          {/* 右側：曲選択 */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t("myBest9.selectSongsTitle", {
                      count: selectedSongs.length,
                    })}
                  </h2>
                </div>

                {/* スマホ表示では現在の位置を維持 */}
                <div className="lg:hidden">
                  {renderSelectedSongsSection("grid grid-cols-2 gap-2")}
                </div>

                {/* 利用可能な曲のリスト */}
                <div>
                  <Group gap="xs" mb={8}>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={activeFilter === "all" ? "filled" : "light"}
                      onClick={() => setActiveFilter("all")}
                    >
                      {t("myBest9.filters.all")}
                    </MantineButton>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={activeFilter === "original" ? "filled" : "light"}
                      onClick={() => setActiveFilter("original")}
                    >
                      {t("myBest9.filters.original")}
                    </MantineButton>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={activeFilter === "cover" ? "filled" : "light"}
                      onClick={() => setActiveFilter("cover")}
                    >
                      {t("myBest9.filters.cover")}
                    </MantineButton>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={
                        activeFilter === "unit-guest" ? "filled" : "light"
                      }
                      onClick={() => setActiveFilter("unit-guest")}
                    >
                      {t("myBest9.filters.unitGuest")}
                    </MantineButton>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={
                        activeFilter === "live-singing" ? "filled" : "light"
                      }
                      onClick={() => setActiveFilter("live-singing")}
                    >
                      {t("myBest9.filters.liveSinging")}
                    </MantineButton>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={
                        activeFilter === "collaboration" ? "filled" : "light"
                      }
                      onClick={() => setActiveFilter("collaboration")}
                    >
                      {t("myBest9.filters.collaboration")}
                    </MantineButton>
                  </Group>
                  <TextInput
                    placeholder={t("myBest9.search.placeholder")}
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.currentTarget.value)}
                    leftSection={<HiSearch />}
                    mb={8}
                  />
                  <Text size="sm" c="dimmed" mb={8}>
                    {t("myBest9.displaying", { count: displayedSongs.length })}
                    {songSearchQuery.trim() &&
                      ` / ${uniqueCategorySongs.length} ${t("myBest9.totalSuffix")}`}
                  </Text>
                  <div className="h-95 lg:h-[calc(100dvh-280px)] min-h-95">
                    {isLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pr-2">
                        {Array.from({ length: 12 }).map((_, index) => (
                          <article
                            key={`song-skeleton-${index}-${activeFilter}`}
                            className="rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                          >
                            <Skeleton height={80} radius={0} />
                            <div className="p-2">
                              <Skeleton height={14} mb={6} radius="sm" />
                              <Skeleton height={10} width="70%" radius="sm" />
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <ScrollArea h="100%" viewportRef={songListViewportRef}>
                        <div style={{ height: `${tileStartOffset}px` }} />

                        <div
                          className="grid gap-2 pr-2"
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
                                selectedSongs.length >= 9 && !isSelected;

                              return (
                                <article
                                  key={`${virtualRow.key}-${song.video_id}-${song.start}-${itemIndexInRow}`}
                                  ref={
                                    itemIndexInRow === 0
                                      ? tileVirtualizer.measureElement
                                      : undefined
                                  }
                                  onClick={() => {
                                    if (!isSelected && !isDisabled) {
                                      addSong(song);
                                    } else if (isSelected) {
                                      removeSong(
                                        song.video_id,
                                        String(song.start),
                                      );
                                    }
                                  }}
                                  className={`cursor-pointer rounded overflow-hidden border shadow-sm transition ${
                                    isSelected
                                      ? "border-pink-500 bg-pink-100 dark:bg-pink-900/40"
                                      : isDisabled
                                        ? "cursor-not-allowed border-gray-300 bg-gray-100 opacity-50 dark:border-gray-600 dark:bg-gray-800"
                                        : "border-gray-200 bg-white hover:bg-primary-100/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-primary-900/20"
                                  }`}
                                >
                                  <div className="w-full aspect-video bg-black">
                                    <YoutubeThumbnail
                                      videoId={song.video_id}
                                      alt={song.title}
                                      fill={true}
                                    />
                                  </div>
                                  <div className="p-2">
                                    <Text
                                      size="sm"
                                      truncate
                                      className="font-medium"
                                    >
                                      {song.title}
                                    </Text>
                                    <Text size="xs" c="dimmed" truncate>
                                      {song.artist}
                                    </Text>
                                    <Text size="xs" c="dimmed" mt={2}>
                                      {formatBroadcastDate(
                                        song.broadcast_at,
                                        locale,
                                        t,
                                      )}
                                    </Text>
                                    <MantineButton
                                      size="compact-xs"
                                      color="pink"
                                      variant="light"
                                      className="inline-flex mt-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewSong(song);
                                      }}
                                    >
                                      <FaPlay className="mr-1" />
                                      再生
                                    </MantineButton>
                                    {isSelected && (
                                      <Badge size="xs" color="pink" mt={4}>
                                        選択中
                                      </Badge>
                                    )}
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
                </div>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
}
