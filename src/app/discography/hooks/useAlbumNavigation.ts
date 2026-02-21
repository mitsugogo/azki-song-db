import { useEffect, Dispatch, SetStateAction } from "react";
import { ReadonlyURLSearchParams } from "next/navigation";
import { Song } from "../../types/song";
import { createStatistics } from "../createStatistics";

interface UseAlbumNavigationParams {
  loading: boolean;
  songs: Song[];
  searchParams: ReadonlyURLSearchParams | null;
  setGroupByAlbum: Dispatch<SetStateAction<boolean>>;
  setActiveTab: Dispatch<SetStateAction<number>>;
  setExpandedItem: Dispatch<SetStateAction<string | null>>;
  setAnchorToScroll: Dispatch<SetStateAction<string | null>>;
  skipClearOnTabChange: React.MutableRefObject<boolean>;
}

/**
 * URLパラメータからアルバムを検索し、該当するタブとアイテムを展開するカスタムフック
 */
export function useAlbumNavigation({
  loading,
  songs,
  searchParams,
  setGroupByAlbum,
  setActiveTab,
  setExpandedItem,
  setAnchorToScroll,
  skipClearOnTabChange,
}: UseAlbumNavigationParams) {
  useEffect(() => {
    if (loading) return;

    try {
      const albumParam = searchParams?.get("album");
      const categoryParam = searchParams?.get("category");
      if (!albumParam && !categoryParam) return;

      // album があればそちらを優先して開く
      if (albumParam) {
        const decoded = albumParam;

        // groupByAlbum を有効にして、該当アルバムの統計項目を探す
        setGroupByAlbum(true);

        // 各タブ向けの統計を作成して、どのタブに該当するかを判定する
        const originals = songs.filter(
          (s) =>
            s.tags &&
            (s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV")),
        );
        const originalStats = createStatistics(
          originals,
          (s) => s.album || s.title,
          true,
        );

        const units = songs
          .filter(
            (s) => s.tags.includes("オリ曲") || s.tags.includes("オリ曲MV"),
          )
          .filter(
            (s) =>
              s.tags.includes("ユニット曲") ||
              s.tags.includes("ゲスト参加") ||
              s.title.includes("feat. AZKi") ||
              s.title.includes("feat.AZKi"),
          );
        const unitStats = createStatistics(
          units,
          (s) => s.album || s.title,
          true,
        );

        const covers = songs.filter((s) => s.tags.includes("カバー曲"));
        const coverStats = createStatistics(
          covers,
          (s) => s.album || s.title,
          true,
        );

        // 優先順位: ユニット曲 -> オリジナル -> カバー
        let matched =
          unitStats.find(
            (it) =>
              it.firstVideo.album === decoded ||
              it.key === decoded ||
              it.song.album === decoded,
          ) ?? null;
        let targetTab = 1;

        if (!matched) {
          matched =
            originalStats.find(
              (it) =>
                it.firstVideo.album === decoded ||
                it.key === decoded ||
                it.song.album === decoded,
            ) ?? null;
          targetTab = 0;
        }

        if (!matched) {
          matched =
            coverStats.find(
              (it) =>
                it.firstVideo.album === decoded ||
                it.key === decoded ||
                it.song.album === decoded,
            ) ?? null;
          targetTab = 2;
        }

        if (matched) {
          skipClearOnTabChange.current = true;
          setTimeout(() => {
            skipClearOnTabChange.current = false;
          }, 300);

          setActiveTab(targetTab);
          setExpandedItem(matched.key as string);
          setAnchorToScroll(matched.key as string);
        }

        return;
      }

      // category パラメータがあればタブを切り替える（ラベル／スラッグ照合）
      if (categoryParam) {
        const cat = categoryParam.toLowerCase();

        const originals = new Set(
          ["originals", "original", "ori", "オリジナル", "オリ曲"].map((s) =>
            String(s).toLowerCase(),
          ),
        );
        const collabs = new Set(
          [
            "collab",
            "collabo",
            "collaboration",
            "collaborations",
            "unit",
            "ユニット",
            "コラボ",
            "コラボ曲",
            "ゲスト",
          ].map((s) => String(s).toLowerCase()),
        );
        const covers = new Set(
          ["covers", "cover", "カバー", "カバー曲"].map((s) =>
            String(s).toLowerCase(),
          ),
        );

        let mapped: number | null = null;
        if (originals.has(cat) || cat.includes("original")) mapped = 0;
        else if (
          collabs.has(cat) ||
          cat.includes("collab") ||
          cat.includes("unit") ||
          cat.includes("guest") ||
          cat.includes("コラボ") ||
          cat.includes("ユニット")
        )
          mapped = 1;
        else if (
          covers.has(cat) ||
          cat.includes("cover") ||
          cat.includes("カバー")
        )
          mapped = 2;

        if (mapped !== null) {
          setActiveTab(mapped);
          setExpandedItem(null);
          setAnchorToScroll(null);
        }
      }
    } catch (e) {
      // ignore
    }
  }, [
    loading,
    songs,
    searchParams,
    setGroupByAlbum,
    setActiveTab,
    setExpandedItem,
    setAnchorToScroll,
    skipClearOnTabChange,
  ]);
}
