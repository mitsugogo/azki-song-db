"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Song } from "../types/song";
import SongListItem from "../components/SongListItem";
import YoutubeThumbnail from "../components/YoutubeThumbnail";
import useSongs from "../hook/useSongs";
import usePlayerControls from "../hook/usePlayerControls";
import useSearch from "../hook/useSearch";
import Link from "next/link";
import { TagsInput, Group, Text, LoadingOverlay, Button } from "@mantine/core";
import { HiSearch } from "react-icons/hi";
import { FaMusic, FaUser, FaTag, FaUsers } from "react-icons/fa6";
import { FaCalendar } from "react-icons/fa";
import {
  collabUnits,
  getCollabUnitName,
  normalizeMemberNames,
} from "../config/collabUnits";

interface TagCategory {
  label: string;
  value: string;
  filter: (songs: Song[]) => Song[];
}

// 画面幅からGridの列数を推定
const getGridCols = (width: number): number => {
  if (width >= 2560) return 5;
  if (width >= 1920) return 4;
  if (width >= 1280) return 3;
  if (width >= 768) return 2;
  return 1;
};

// あいうえお順ソート関数
const sortJapaneseAndEnglish = (a: string, b: string): number => {
  return a.localeCompare(b, "ja");
};

type FilterMode =
  | "categories"
  | "title"
  | "artist"
  | "tag"
  | "singer"
  | "collab";

const SearchPageClient = () => {
  const { allSongs, isLoading } = useSongs();
  const [windowWidth, setWindowWidth] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagParam = searchParams.get("tag");
  const qParam = searchParams.get("q");
  const [searchValue, setSearchValue] = useState<string[]>([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  const [filterMode, setFilterMode] = useState<FilterMode>("categories");

  // useSearch フックで検索機能を使用
  const { searchTerm, setSearchTerm, searchSongs } = useSearch(allSongs);

  // URLパラメータから検索クエリを取得して同期
  useEffect(() => {
    if (qParam) {
      const decodedQuery = decodeURIComponent(qParam);
      setCurrentSearchTerm(decodedQuery);
      setSearchTerm(decodedQuery);
      // searchValueは`|`で分割したパイプ区切りの値を配列として設定
      setSearchValue(decodedQuery.split("|").filter((v) => v.trim()));
    } else {
      setCurrentSearchTerm("");
      setSearchValue([]);
    }
  }, [qParam, setSearchTerm]);

  // 全曲リストで usePlayerControls を初期化
  const { currentSongInfo, changeCurrentSong } = usePlayerControls(
    allSongs,
    allSongs,
  );

  // タグカテゴリーの定義
  const tagCategories: TagCategory[] = useMemo(
    () => [
      {
        label: "オリ曲",
        value: "tag:オリ曲",
        filter: (songs) => songs.filter((song) => song.tags.includes("オリ曲")),
      },
      {
        label: "歌ってみた",
        value: "tag:歌ってみた",
        filter: (songs) =>
          songs.filter((song) => song.tags.includes("歌ってみた")),
      },
      {
        label: "歌ってみたコラボ",
        value: "tag:歌ってみた|tag:コラボ",
        filter: (songs) =>
          songs.filter(
            (song) =>
              song.tags.includes("歌ってみた") && song.tags.includes("コラボ"),
          ),
      },
      {
        label: "記念ライブ",
        value: "tag:記念ライブ",
        filter: (songs) =>
          songs.filter((song) => song.tags.includes("記念ライブ")),
      },
      {
        label: "ゲスト出演",
        value: "tag:ゲスト出演",
        filter: (songs) =>
          songs.filter((song) => song.tags.includes("ゲスト出演")),
      },
    ],
    [],
  );

  // ウィンドウ幅の監視
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 列数の計算
  const colCount = useMemo(() => getGridCols(windowWidth), [windowWidth]);
  const categorySongs = useMemo(() => {
    return tagCategories.map((category) => {
      const filtered = category.filter(allSongs);
      filtered.sort((a, b) => {
        return (
          new Date(b.broadcast_at).getTime() -
          new Date(a.broadcast_at).getTime()
        );
      });
      return {
        ...category,
        songs: filtered.slice(0, 16), // 2段×最大8列
        totalCount: filtered.length, // 総数を追加
      };
    });
  }, [allSongs, tagCategories]);

  // 検索結果
  const filteredSongs = useMemo(() => {
    if (currentSearchTerm && allSongs.length > 0) {
      // useSearchの高度な検索ロジックを使用
      return searchSongs(allSongs, currentSearchTerm);
    }
    return [];
  }, [currentSearchTerm, allSongs, searchSongs]);

  // タグでフィルタリングされた曲を計算
  const tagFilteredSongs = useMemo(() => {
    if (tagParam && allSongs.length > 0) {
      // tagParamに対応するカテゴリーを見つける
      const category = tagCategories.find((cat) => cat.value === tagParam);
      if (category) {
        const filtered = category.filter(allSongs);
        filtered.sort((a, b) => {
          return (
            new Date(b.broadcast_at).getTime() -
            new Date(a.broadcast_at).getTime()
          );
        });
        return filtered;
      }
    }
    return [];
  }, [tagParam, allSongs, tagCategories]);

  // 検索データを生成
  const searchData = useMemo(() => {
    const availableTags = Array.from(
      new Set(allSongs.flatMap((song) => song.tags)),
    ).filter((tag) => tag !== "");

    const availableMilestones = Array.from(
      new Set(allSongs.flatMap((song) => song.milestones || [])),
    ).filter((milestone) => milestone !== "");

    const availableArtists = Array.from(
      new Set(allSongs.map((song) => song.artist)),
    ).filter((artist) => artist !== "");

    const availableSingers = Array.from(
      new Set(allSongs.map((song) => song.sing)),
    ).filter((singer) => singer !== "");

    const availableTitles = Array.from(
      new Set(allSongs.map((song) => song.title)),
    ).filter((title) => title !== "");

    // ユニット（コラボ通称）のリスト作成
    const availableUnits = collabUnits
      .filter((unit) => {
        // 実際にそのユニットの曲が存在するかチェック
        return allSongs.some((song) => {
          if (song.sing === "") return false;
          const singers = song.sing
            .split("、")
            .map((s) => s.trim())
            .filter((s) => s !== "");
          if (singers.length !== unit.members.length) return false;
          const sortedSingers = normalizeMemberNames(singers);
          const sortedUnitMembers = normalizeMemberNames(unit.members);
          return sortedUnitMembers.every((m, i) => m === sortedSingers[i]);
        });
      })
      .map((unit) => unit.unitName);

    return [
      {
        group: "タグ",
        items: availableTags.map((tag) => `tag:${tag}`),
      },
      {
        group: "マイルストーン",
        items: availableMilestones.map((milestone) => `milestone:${milestone}`),
      },
      {
        group: "アーティスト",
        items: availableArtists.map((artist) => `artist:${artist}`),
      },
      {
        group: "歌った人",
        items: availableSingers.map((singer) => `sing:${singer}`),
      },
      {
        group: "ユニット",
        items: availableUnits.map((unit) => `unit:${unit}`),
      },
      {
        group: "曲名",
        items: availableTitles.map((title) => `title:${title}`),
      },
      {
        group: "配信年",
        items: Array.from(new Set(allSongs.map((song) => song.year)))
          .filter((year): year is number => year !== undefined)
          .sort((a, b) => b - a)
          .map((year) => `year:${year}`),
      },
      {
        group: "季節",
        items: ["season:春", "season:夏", "season:秋", "season:冬"],
      },
    ];
  }, [allSongs]);

  // フィルターモード用データ生成
  const filterModeData = useMemo(() => {
    if (filterMode === "title") {
      // 曲名 + アーティストのユニークな組み合わせと歌った回数
      const titleCountMap = new Map<string, number>();
      allSongs.forEach((song) => {
        const key = `${song.title}|||${song.artist}`;
        titleCountMap.set(key, (titleCountMap.get(key) || 0) + 1);
      });

      const uniqueTitles = Array.from(titleCountMap.entries())
        .map(([combined, count]) => {
          const [title, artist] = combined.split("|||");
          return { title, artist, count };
        })
        .sort((a, b) => sortJapaneseAndEnglish(a.title, b.title));
      return uniqueTitles;
    } else if (filterMode === "artist") {
      // アーティストのユニークリストと曲数
      const artistCountMap = new Map<string, number>();
      allSongs.forEach((song) => {
        if (song.artist !== "") {
          artistCountMap.set(
            song.artist,
            (artistCountMap.get(song.artist) || 0) + 1,
          );
        }
      });

      const uniqueArtists = Array.from(artistCountMap.entries())
        .map(([artist, count]) => ({ artist, count }))
        .sort((a, b) => sortJapaneseAndEnglish(a.artist, b.artist));
      return uniqueArtists;
    } else if (filterMode === "tag") {
      // タグのユニークリストと曲数
      const tagCountMap = new Map<string, number>();
      allSongs.forEach((song) => {
        song.tags.forEach((tag) => {
          if (tag !== "") {
            tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
          }
        });
      });

      const uniqueTags = Array.from(tagCountMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => sortJapaneseAndEnglish(a.tag, b.tag));
      return uniqueTags;
    } else if (filterMode === "singer") {
      // 歌った人のユニークリストと曲数
      const singerCountMap = new Map<string, number>();
      allSongs.forEach((song) => {
        if (song.sing !== "") {
          // 「、」で区切って各歌手を個別にカウント
          const singers = song.sing
            .split("、")
            .map((s) => s.trim())
            .filter((s) => s !== "");
          singers.forEach((singer) => {
            singerCountMap.set(singer, (singerCountMap.get(singer) || 0) + 1);
          });
        }
      });

      const uniqueSingers = Array.from(singerCountMap.entries())
        .map(([singer, count]) => ({ singer, count }))
        .sort((a, b) => sortJapaneseAndEnglish(a.singer, b.singer));
      return uniqueSingers;
    } else if (filterMode === "collab") {
      // コラボのユニークリストと曲数
      const collabCountMap = new Map<
        string,
        { members: string; unitName: string | null; count: number }
      >();
      allSongs.forEach((song) => {
        if (song.sing !== "") {
          // 「、」で区切って複数人かチェック
          const singers = song.sing
            .split("、")
            .map((s) => s.trim())
            .filter((s) => s !== "");
          if (singers.length >= 2) {
            // 名前をソートして正規化（順序を統一）
            const sortedSingers = normalizeMemberNames(singers);
            const normalizedCollab = sortedSingers.join("、");
            const unitName = getCollabUnitName(sortedSingers);

            const existing = collabCountMap.get(normalizedCollab);
            if (existing) {
              existing.count++;
            } else {
              collabCountMap.set(normalizedCollab, {
                members: normalizedCollab,
                unitName,
                count: 1,
              });
            }
          }
        }
      });

      const uniqueCollabs = Array.from(collabCountMap.values()).sort(
        (a, b) => b.count - a.count,
      );
      return uniqueCollabs;
    }
    return [];
  }, [allSongs, filterMode]);

  // TOPページと同じrenderOptionを使用
  const renderMultiSelectOption = ({
    option,
  }: {
    option: { value: string };
  }) => (
    <Group gap="sm">
      {option.value.includes("title:") && <FaMusic />}
      {option.value.includes("artist:") && <FaUser />}
      {option.value.includes("sing:") && <FaUser />}
      {option.value.includes("unit:") && <FaUsers />}
      {option.value.includes("tag:") && <FaTag />}
      {option.value.includes("milestone:") && "★"}
      {option.value.includes("year:") && <FaCalendar />}
      {option.value.includes("season:") && "季節:"}
      <div>
        <Text size="sm">
          {option.value
            .replace("title:", "")
            .replace("artist:", "")
            .replace("sing:", "")
            .replace("unit:", "")
            .replace("tag:", "")
            .replace("milestone:", "")
            .replace("season:", "")}
        </Text>
      </div>
    </Group>
  );

  // カスタム検索フィルター（不要になったため削除）

  if (isLoading) {
    return (
      <div className="flex-grow lg:p-6 lg:pb-0 overflow-auto relative">
        <LoadingOverlay
          visible={true}
          zIndex={1000}
          loaderProps={{ color: "pink", type: "bars" }}
          overlayProps={{ blur: 2 }}
        />
      </div>
    );
  }

  // 検索結果が存在する場合はそれを表示
  if (currentSearchTerm && filteredSongs.length > 0) {
    return (
      <div className="flex-grow lg:p-6 lg:pb-0 overflow-auto">
        {/* タイトルと説明 */}
        <div className="mb-4">
          <Link
            href="/search"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm p-3"
          >
            ← 検索に戻る
          </Link>
          <h1 className="font-extrabold text-2xl p-3 flex items-center gap-2">
            {currentSearchTerm.startsWith("unit:") && <FaUsers />}
            {currentSearchTerm.startsWith("unit:")
              ? `${currentSearchTerm.replace("unit:", "")}の検索結果`
              : `「${currentSearchTerm}」の検索結果`}
          </h1>
          <div className="p-3">
            <p className="text-sm text-light-gray-400 mb-6">
              {filteredSongs.length} 件の楽曲が見つかりました
            </p>
          </div>
        </div>

        {/* 検索バー */}
        <div className="mb-4 px-3">
          <TagsInput
            placeholder="検索"
            leftSection={<HiSearch />}
            data={searchData}
            renderOption={renderMultiSelectOption}
            maxDropdownHeight={200}
            value={searchValue}
            onChange={(values: string[]) => {
              setSearchValue(values);
              const searchQuery = values.join("|");
              setSearchTerm(searchQuery);
              // URLを更新
              if (searchQuery) {
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
              } else {
                router.push("/search");
              }
            }}
            limit={15}
            splitChars={["|"]}
            comboboxProps={{
              shadow: "md",
              transitionProps: { transition: "pop", duration: 100 },
            }}
            clearable
          />
        </div>

        {/* グリッド */}
        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredSongs.map((song) => (
              <article
                key={`${song.video_id}-${song.start}-${song.title}`}
                className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <Link
                  href={`/?v=${song.video_id}${
                    song.start ? `&t=${song.start}s` : ""
                  }`}
                  className="block"
                >
                  <div className="w-full aspect-video bg-black">
                    <YoutubeThumbnail
                      videoId={song.video_id}
                      alt={song.title}
                      fill={true}
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-medium line-clamp-2">{song.title}</div>
                    {song.artist && (
                      <div className="text-sm text-gray-700 dark:text-light-gray-400 line-clamp-1">
                        {song.artist}
                      </div>
                    )}
                    <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
                      {new Date(song.broadcast_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 検索結果がないが検索中の場合
  if (currentSearchTerm && filteredSongs.length === 0) {
    return (
      <div className="flex-grow lg:p-6 lg:pb-0 overflow-auto">
        {/* タイトルと説明 */}
        <div className="mb-4">
          <Link
            href="/search"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm p-3"
          >
            ← 検索に戻る
          </Link>
          <h1 className="font-extrabold text-2xl p-3 flex items-center gap-2">
            {currentSearchTerm.startsWith("unit:") && <FaUsers />}
            {currentSearchTerm.startsWith("unit:")
              ? `${currentSearchTerm.replace("unit:", "")}の検索結果`
              : `「${currentSearchTerm}」の検索結果`}
          </h1>
          <div className="p-3">
            <p className="text-sm text-light-gray-400 mb-6">
              該当する曲がありません
            </p>
          </div>
        </div>

        {/* 検索バー */}
        <div className="mb-4 px-3">
          <TagsInput
            placeholder="検索"
            leftSection={<HiSearch />}
            data={searchData}
            renderOption={renderMultiSelectOption}
            maxDropdownHeight={200}
            value={searchValue}
            onChange={(values: string[]) => {
              setSearchValue(values);
              const searchQuery = values.join("|");
              setSearchTerm(searchQuery);
              // URLを更新
              if (searchQuery) {
                router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
              } else {
                router.push("/search");
              }
            }}
            limit={15}
            splitChars={["|"]}
            comboboxProps={{
              shadow: "md",
              transitionProps: { transition: "pop", duration: 100 },
            }}
            clearable
          />
        </div>
      </div>
    );
  }

  // タグでフィルタリングされた曲がある場合
  if (tagParam && tagFilteredSongs.length > 0) {
    const selectedCategory = tagCategories.find(
      (cat) => cat.value === tagParam,
    );
    return (
      <div className="flex-grow lg:p-6 lg:pb-0 overflow-auto">
        {/* タイトルと説明 */}
        <div className="mb-4">
          <Link
            href="/search"
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm p-3"
          >
            ← 検索に戻る
          </Link>
          <h1 className="font-extrabold text-2xl p-3">
            {selectedCategory?.label}
          </h1>
          <div className="p-3">
            <p className="text-sm text-light-gray-400 mb-6">
              {tagFilteredSongs.length} 件の楽曲が見つかりました
            </p>
          </div>
        </div>

        {/* グリッド */}
        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {tagFilteredSongs.map((song) => (
              <article
                key={`${song.video_id}-${song.start}-${song.title}`}
                className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <Link
                  href={`/?v=${song.video_id}${
                    song.start ? `&t=${song.start}s` : ""
                  }`}
                  className="block"
                >
                  <div className="w-full aspect-video bg-black">
                    <YoutubeThumbnail
                      videoId={song.video_id}
                      alt={song.title}
                      fill={true}
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-medium line-clamp-2">{song.title}</div>
                    {song.artist && (
                      <div className="text-sm text-gray-700 dark:text-light-gray-400 line-clamp-1">
                        {song.artist}
                      </div>
                    )}
                    <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
                      {new Date(song.broadcast_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // カテゴリー表示（検索がない場合）
  return (
    <div className="flex-grow lg:p-6 lg:pb-0 overflow-auto">
      {/* タイトルと説明 */}
      <div>
        <h1 className="font-extrabold text-2xl p-3">検索</h1>
        <div className="p-3">
          <p className="text-sm text-light-gray-400 mb-6">
            楽曲を検索できます。全{allSongs.length}
            曲を収録。各カテゴリーの最新16曲を表示しています。
          </p>
        </div>
      </div>

      {/* 検索バー */}
      <div className="mb-4 px-3">
        <TagsInput
          placeholder="曲名、アーティスト、タグなどで検索"
          leftSection={<HiSearch />}
          data={searchData}
          renderOption={renderMultiSelectOption}
          maxDropdownHeight={200}
          value={searchValue}
          onChange={(values: string[]) => {
            setSearchValue(values);
            const searchQuery = values.join("|");
            setSearchTerm(searchQuery);
            // URLを更新
            if (searchQuery) {
              router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            } else {
              router.push("/search");
            }
          }}
          limit={15}
          splitChars={["|"]}
          comboboxProps={{
            shadow: "md",
            transitionProps: { transition: "pop", duration: 100 },
          }}
          clearable
        />
      </div>

      {/* フィルターボタン */}
      <div className="px-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterMode === "categories" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("categories")}
          >
            カテゴリー
          </Button>
          <Button
            variant={filterMode === "title" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("title")}
            leftSection={<FaMusic />}
          >
            曲名
          </Button>
          <Button
            variant={filterMode === "artist" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("artist")}
            leftSection={<FaUser />}
          >
            アーティスト
          </Button>
          <Button
            variant={filterMode === "tag" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("tag")}
            leftSection={<FaTag />}
          >
            タグ
          </Button>
          <Button
            variant={filterMode === "singer" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("singer")}
            leftSection={<FaUser />}
          >
            歌った人
          </Button>
          <Button
            variant={filterMode === "collab" ? "filled" : "light"}
            color="pink"
            size="sm"
            onClick={() => setFilterMode("collab")}
            leftSection={<FaUsers />}
          >
            コラボ・ユニット
          </Button>
        </div>
      </div>

      {/* フィルターモードごとの表示 */}
      {filterMode === "categories" ? (
        // カテゴリー表示
        <div className="p-3">
          {categorySongs.map((category) => (
            <section key={category.value} className="mb-8">
              {/* セクションヘッダー */}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white">
                  {category.label} ({category.totalCount})
                </h2>
                {category.songs.length === 16 && (
                  <a
                    href={`/search?q=${encodeURIComponent(category.value)}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    » もっと見る
                  </a>
                )}
              </div>

              {/* グリッド */}
              {category.songs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    該当する曲がありません
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 grid-rows-2 gap-4">
                  {category.songs.map((song) => (
                    <article
                      key={`${song.video_id}-${song.start}-${song.title}`}
                      className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      <Link
                        href={`/?v=${song.video_id}${
                          song.start ? `&t=${song.start}s` : ""
                        }`}
                        className="block"
                      >
                        <div className="w-full aspect-video bg-black">
                          <YoutubeThumbnail
                            videoId={song.video_id}
                            alt={song.title}
                            fill={true}
                          />
                        </div>
                        <div className="p-3">
                          <div className="font-medium line-clamp-2">
                            {song.title}
                          </div>
                          {song.artist && (
                            <div className="text-sm text-gray-700 dark:text-light-gray-400 line-clamp-1">
                              {song.artist}
                            </div>
                          )}
                          <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
                            {new Date(song.broadcast_at).toLocaleDateString()}
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        // フィルターモード表示
        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filterMode === "title" &&
              Array.isArray(filterModeData) &&
              (() => {
                const maxCount = Math.max(
                  ...(
                    filterModeData as {
                      title: string;
                      artist: string;
                      count: number;
                    }[]
                  ).map((item) => item.count),
                  1,
                );
                return (
                  filterModeData as {
                    title: string;
                    artist: string;
                    count: number;
                  }[]
                ).map((item, index) => {
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <Link
                      key={index}
                      href={`/search?q=${encodeURIComponent(
                        `title:${item.title}|artist:${item.artist}`,
                      )}`}
                      className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 p-3">
                        <div className="font-medium text-sm line-clamp-2">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                          {item.artist}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {item.count}回
                        </div>
                      </div>
                    </Link>
                  );
                });
              })()}
            {filterMode === "artist" &&
              Array.isArray(filterModeData) &&
              (() => {
                const maxCount = Math.max(
                  ...(
                    filterModeData as { artist: string; count: number }[]
                  ).map((item) => item.count),
                  1,
                );
                return (
                  filterModeData as { artist: string; count: number }[]
                ).map((item, index) => {
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <Link
                      key={index}
                      href={`/search?q=${encodeURIComponent(`artist:${item.artist}`)}`}
                      className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 p-3">
                        <div className="font-medium text-sm line-clamp-2">
                          {item.artist}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {item.count}曲
                        </div>
                      </div>
                    </Link>
                  );
                });
              })()}
            {filterMode === "tag" &&
              Array.isArray(filterModeData) &&
              (() => {
                const maxCount = Math.max(
                  ...(filterModeData as { tag: string; count: number }[]).map(
                    (item) => item.count,
                  ),
                  1,
                );
                return (filterModeData as { tag: string; count: number }[]).map(
                  (item, index) => {
                    const pct = Math.round((item.count / maxCount) * 100);
                    return (
                      <Link
                        key={index}
                        href={`/search?q=${encodeURIComponent(`tag:${item.tag}`)}`}
                        className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 p-3">
                          <div className="font-medium text-sm line-clamp-2">
                            {item.tag}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {item.count}曲
                          </div>
                        </div>
                      </Link>
                    );
                  },
                );
              })()}
            {filterMode === "singer" &&
              Array.isArray(filterModeData) &&
              (() => {
                const counts = (
                  filterModeData as { singer: string; count: number }[]
                ).map((item) => item.count);
                const maxSqrt = Math.max(...counts.map((c) => Math.sqrt(c)), 1);
                return (
                  filterModeData as { singer: string; count: number }[]
                ).map((item, index) => {
                  const pct = Math.round(
                    (Math.sqrt(item.count) / maxSqrt) * 100,
                  );
                  return (
                    <Link
                      key={index}
                      href={`/search?q=${encodeURIComponent(`sing:${item.singer}`)}`}
                      className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 p-3">
                        <div className="font-medium text-sm line-clamp-2">
                          {item.singer}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {item.count}曲
                        </div>
                      </div>
                    </Link>
                  );
                });
              })()}
            {filterMode === "collab" &&
              Array.isArray(filterModeData) &&
              (() => {
                const maxCount = Math.max(
                  ...(
                    filterModeData as {
                      members: string;
                      unitName: string | null;
                      count: number;
                    }[]
                  ).map((item) => item.count),
                  1,
                );
                return (
                  filterModeData as {
                    members: string;
                    unitName: string | null;
                    count: number;
                  }[]
                ).map((item, index) => {
                  const pct = Math.round((item.count / maxCount) * 100);
                  return (
                    <Link
                      key={index}
                      href={`/search?q=${encodeURIComponent(
                        item.unitName
                          ? `unit:${item.unitName}`
                          : item.members
                              .split("、")
                              .map((singer) => `sing:${singer}`)
                              .join("|"),
                      )}`}
                      className="block relative overflow-hidden rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 p-3">
                        <div className="font-medium text-sm line-clamp-2">
                          {item.unitName || item.members}
                        </div>
                        {item.unitName && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-1">
                            （{item.members}）
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {item.count}曲
                        </div>
                      </div>
                    </Link>
                  );
                });
              })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPageClient;
