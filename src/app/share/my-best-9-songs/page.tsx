"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
} from "@mantine/core";
import { MdContentCopy } from "react-icons/md";
import { useSearchParams } from "next/navigation";
import SearchBreadcrumb from "../../search/components/SearchBreadcrumb";
import { Song } from "../../types/song";
import useMyBestNineSongsDraft from "../../hook/useMyBestNineSongsDraft";
import {
  isPossibleOriginalSong,
  isCoverSong,
  isCollaborationSong,
} from "../../config/filters";
import YoutubeThumbnail from "../../components/YoutubeThumbnail";
import useSongs from "../../hook/useSongs";

type SongCategoryFilter = "original" | "cover" | "unit-guest";
const DEFAULT_TITLE = "私が選んだAZKi究極の9曲";

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

  const [activeFilter, setActiveFilter] =
    useState<SongCategoryFilter>("original");
  const [title, setTitle] = useState(() => queryTitle || DEFAULT_TITLE);
  const [author, setAuthor] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedThemeUrl, setCopiedThemeUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerateLocked, setIsGenerateLocked] = useState(false);
  const lockedSelectionKeyRef = useRef<string | null>(null);

  const { draft, saveDraft, clearDraft } = useMyBestNineSongsDraft();
  const { allSongs, isLoading } = useSongs();

  const isUnitOrGuestSong = (song: Song) => {
    return isCollaborationSong(song);
  };

  // 選択対象の全候補（オリ曲/カバー曲/ユニット・ゲスト曲）
  const selectableSongs = useMemo(
    () =>
      allSongs.filter(
        (song) =>
          isPossibleOriginalSong(song) ||
          isCoverSong(song) ||
          isUnitOrGuestSong(song),
      ),
    [allSongs],
  );

  const filteredSongs = useMemo(() => {
    if (activeFilter === "original") {
      return selectableSongs.filter((song) => isPossibleOriginalSong(song));
    }

    if (activeFilter === "cover") {
      return selectableSongs.filter((song) => isCoverSong(song));
    }

    return selectableSongs.filter((song) => isUnitOrGuestSong(song));
  }, [activeFilter, selectableSongs]);

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

  // ドラフトを復元（初回のみ実行。URLのtitleパラメータは初回ロード時の値のみ使用する）
  useEffect(() => {
    if (hasRestoredDraftRef.current) return;
    if (draft && allSongs.length > 0) {
      hasRestoredDraftRef.current = true;
      setTitle(initialQueryTitleRef.current || draft.title || DEFAULT_TITLE);
      setAuthor(draft.author || "");

      // ドラフトの曲を復元
      const draftSongs = draft.songs
        .map((entry) => {
          const song = allSongs.find((s) => s.video_id === entry.v);
          return song;
        })
        .filter((s): s is Song => s !== undefined);

      setSelectedSongs(draftSongs);
    }
  }, [draft, allSongs]);

  // 曲を選択に追加
  const addSong = (song: Song) => {
    if (
      selectedSongs.length < 9 &&
      !selectedSongs.find((s) => s.video_id === song.video_id)
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
  const removeSong = (videoId: string) => {
    const newSelected = selectedSongs.filter((s) => s.video_id !== videoId);
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
      alert("タイトルを入力してください");
      return;
    }

    if (selectedSongs.length === 0) {
      alert("最低1曲は選択してください");
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
        throw new Error(errorData.error || "共有データの保存に失敗しました");
      }

      const data = (await response.json()) as { id: string };
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/my-best-9-songs/${data.id}`;
      setGeneratedUrl(url);
      setIsGenerateLocked(true);
      lockedSelectionKeyRef.current = currentSelectionKey;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "共有データの保存に失敗しました";
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

  return (
    <div className="grow lg:p-6 lg:pb-0 overflow-auto">
      <SearchBreadcrumb currentLabel="究極の9曲 作成" />

      <div>
        <h1 className="font-extrabold text-2xl p-3">究極の9曲を作成</h1>
        <div className="p-3">
          <p className="text-sm text-gray-600 dark:text-light-gray-400">
            オリジナル曲とカバー曲から、最大9曲を選んでSNSで共有できます
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
                    label="タイトル"
                    placeholder="例: 私が選んだAZKi究極の九曲"
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
                        ? "コピーしました！"
                        : "このタイトルで回答を募集するURLをコピー"
                    }
                  >
                    <MantineButton
                      size="xs"
                      variant="subtle"
                      color="blue"
                      leftSection={<MdContentCopy size={14} />}
                      onClick={() => {
                        const themeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/my-best-9-songs?title=${encodeURIComponent(title.trim())}`;
                        navigator.clipboard.writeText(themeUrl);
                        setCopiedThemeUrl(true);
                        setTimeout(() => setCopiedThemeUrl(false), 2000);
                      }}
                      disabled={!title.trim()}
                    >
                      {copiedThemeUrl
                        ? "コピーしました！"
                        : "このお題を募集するURLをコピー"}
                    </MantineButton>
                  </Tooltip>
                </div>

                {/* 作成者名入力 */}
                <div>
                  <TextInput
                    label="作成者名（任意）"
                    placeholder="例: みつごご"
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
                    <Text fw={500}>選択済み: {selectedSongs.length}/9</Text>
                    <Badge
                      size="sm"
                      variant="dot"
                      color={isFilled ? "green" : "gray"}
                    >
                      {isFilled ? "選択中" : "未選択"}
                    </Badge>
                  </Group>
                  <Progress value={filledPercentage} color="pink" />
                </div>

                {/* URLのコピーボタン */}
                {generatedUrl && (
                  <div>
                    <Text size="sm" fw={500} mb={8}>
                      共有URL
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
                          copied ? "コピーしました！" : "クリップボードにコピー"
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
                          コピー
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
                      X（Twitter）でシェア
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
                    ? "保存中..."
                    : isGenerateLocked
                      ? "共有URL作成済み"
                      : "共有URLを生成"}
                </MantineButton>

                {/* ドラフト削除 */}
                <MantineButton
                  onClick={() => {
                    setTitle(DEFAULT_TITLE);
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
                  リセット
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
                    💡
                    作成したURLをSNSで共有すると、プレビュー画面に9曲のサムネイルが表示されます
                  </Text>
                </Paper>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* 右側：曲選択 */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    曲を選択 ({selectedSongs.length}/9)
                  </h2>
                </div>

                {/* 選择済み曲の表示 */}
                {selectedSongs.length > 0 && (
                  <div className="mb-4">
                    <Text size="sm" fw={500} mb={8}>
                      選択済みの曲
                    </Text>
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {selectedSongs.map((song) => (
                        <div
                          key={song.video_id}
                          className="relative cursor-pointer rounded overflow-hidden border border-pink-300 bg-pink-50 shadow-sm transition hover:bg-pink-100 dark:border-pink-700 dark:bg-gray-800"
                          onClick={() => removeSong(song.video_id)}
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
                              クリックで削除
                            </Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 利用可能な曲のリスト */}
                <div>
                  <Group gap="xs" mb={8}>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={activeFilter === "original" ? "filled" : "light"}
                      onClick={() => setActiveFilter("original")}
                    >
                      オリ曲
                    </MantineButton>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={activeFilter === "cover" ? "filled" : "light"}
                      onClick={() => setActiveFilter("cover")}
                    >
                      カバー曲
                    </MantineButton>
                    <MantineButton
                      size="xs"
                      color="pink"
                      variant={
                        activeFilter === "unit-guest" ? "filled" : "light"
                      }
                      onClick={() => setActiveFilter("unit-guest")}
                    >
                      ユニット・ゲスト曲
                    </MantineButton>
                  </Group>
                  <Text size="sm" c="dimmed" mb={8}>
                    表示中: {filteredSongs.length}曲
                  </Text>
                  <div className="h-95 lg:h-[calc(100dvh-280px)] min-h-95">
                    {isLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pr-2">
                        {Array.from({ length: 12 }).map((_, index) => (
                          <article
                            key={`song-skeleton-${index}`}
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
                      <ScrollArea h="100%">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pr-2">
                          {filteredSongs.map((song) => {
                            const isSelected = selectedSongs.find(
                              (s) => s.video_id === song.video_id,
                            );
                            const isDisabled =
                              selectedSongs.length >= 9 && !isSelected;

                            return (
                              <article
                                key={song.video_id}
                                onClick={() => {
                                  if (!isSelected && !isDisabled) {
                                    addSong(song);
                                  } else if (isSelected) {
                                    removeSong(song.video_id);
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
                                  {isSelected && (
                                    <Badge size="xs" color="pink" mt={4}>
                                      選択中
                                    </Badge>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
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
