"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useScrollIntoView } from "@mantine/hooks";
import { ScrollToTopButton } from "../../components/ScrollToTopButton";
import { Breadcrumbs, FloatingIndicator, Tabs } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "../../theme";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { useTranslations } from "next-intl";

import { useDiscographyData } from "../hooks/useDiscographyData";
import { useItemVisibility } from "../hooks/useItemVisibility";
import { useAlbumNavigation } from "../hooks/useAlbumNavigation";
import DiscographyControls from "./DiscographyControls";
import ContentRenderer from "./ContentRenderer";
import { scrollToAnchor } from "../utils/scrollHelpers";

const TAB_VALUES = ["0", "1", "2"] as const;
const discographyTabClass =
  "relative z-10 shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold leading-5 text-gray-700 transition-colors hover:text-primary data-[active=true]:text-white dark:text-gray-200 dark:hover:text-pink-200 dark:data-[active=true]:text-white md:px-4 md:py-2 md:text-sm";

export default function DiscographyPage({
  initialCategory,
}: {
  initialCategory?: string;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [groupByAlbum, setGroupByAlbum] = useState(true);
  const [groupByYear, setGroupByYear] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [onlyOriginalMV, setOnlyOriginalMV] = useState(false);
  const [anchorToScroll, setAnchorToScroll] = useState<string | null>(null);
  const [tabsRootRef, setTabsRootRef] = useState<HTMLDivElement | null>(null);
  const [tabRefs, setTabRefs] = useState<
    Record<string, HTMLButtonElement | null>
  >({});
  const tabRefCallbacks = useMemo(
    () =>
      Object.fromEntries(
        TAB_VALUES.map((value) => [
          value,
          (node: HTMLButtonElement | null) => {
            setTabRefs((current) =>
              current[value] === node ? current : { ...current, [value]: node },
            );
          },
        ]),
      ) as Record<string, (node: HTMLButtonElement | null) => void>,
    [],
  );

  const { targetRef } = useScrollIntoView();
  const skipClearOnTabChange = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Discography");

  // 初期カテゴリがサーバ側から渡された場合、それを優先してタブを切り替える
  useEffect(() => {
    if (!initialCategory) return;
    try {
      const cat = String(initialCategory).toLowerCase();
      if (cat.includes("original")) setActiveTab(0);
      else if (
        cat.includes("collab") ||
        cat.includes("collabo") ||
        cat.includes("unit")
      )
        setActiveTab(1);
      else if (cat.includes("cover")) setActiveTab(2);
    } catch (e) {
      // ignore
    }
  }, [initialCategory]);

  // カスタムフックでデータ取得と統計計算
  const {
    loading,
    songs,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  } = useDiscographyData(groupByAlbum, onlyOriginalMV);

  // アイテムの表示アニメーション管理
  const visibleItems = useItemVisibility(
    activeTab,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  );

  // URL/パスに基づくアルバムナビゲーション
  useAlbumNavigation({
    loading,
    songs,
    searchParams,
    pathname,
    setGroupByAlbum,
    setActiveTab,
    setExpandedItem,
    setAnchorToScroll,
    skipClearOnTabChange,
  });

  useEffect(() => {
    if (!anchorToScroll) return;
    scrollToAnchor(anchorToScroll).finally(() => {
      setAnchorToScroll(null);
    });
  }, [anchorToScroll]);

  // アイテムクリックハンドラー
  const handleItemClick = (key: string) => {
    if (key === expandedItem) {
      setExpandedItem(null);
      setAnchorToScroll(null);
      return;
    }

    setExpandedItem(key);
    setAnchorToScroll(key);
  };

  // コントロール変更ハンドラー
  const handleGroupByAlbumChange = () => {
    setGroupByAlbum(!groupByAlbum);
    setExpandedItem(null);
    setAnchorToScroll(null);
  };

  const handleGroupByYearChange = () => {
    setGroupByYear(!groupByYear);
    setExpandedItem(null);
    setAnchorToScroll(null);
  };

  const handleOnlyOriginalMVChange = () => {
    setOnlyOriginalMV(!onlyOriginalMV);
    setExpandedItem(null);
    setAnchorToScroll(null);
  };

  // タブ変更ハンドラー
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    if (skipClearOnTabChange.current) {
      skipClearOnTabChange.current = false;
    } else {
      setExpandedItem(null);
      setAnchorToScroll(null);
    }

    try {
      const tabToCategory = ["originals", "collab", "covers"];
      const cat = tabToCategory[index];
      // album クエリは残す（/discography/{category}?album=...）
      const album = searchParams?.get("album");
      const dest = album
        ? `/discography/${cat}?album=${encodeURIComponent(album)}`
        : `/discography/${cat}`;
      router.push(dest);
    } catch (e) {
      // ignore
    }
  };

  return (
    <>
      <div className={pageClasses.shell}>
        <Breadcrumbs
          aria-label="Breadcrumb"
          className={breadcrumbClasses.root}
          separator={<HiChevronRight className={breadcrumbClasses.separator} />}
        >
          <Link href="/" className={breadcrumbClasses.link}>
            <HiHome className="w-4 h-4 mr-1.5" /> {t("homeLabel")}
          </Link>
          <Link href="/discography" className={breadcrumbClasses.link}>
            {t("breadcrumb")}
          </Link>

          {/** カテゴリに応じたパスを追加 */}
          {(() => {
            try {
              const pathParts = pathname.split("/").filter(Boolean);
              if (pathParts.length >= 2 && pathParts[0] === "discography") {
                const cat = pathParts[1];
                let label = "";
                if (cat.includes("original")) label = "オリジナル楽曲";
                else if (
                  cat.includes("collab") ||
                  cat.includes("collabo") ||
                  cat.includes("unit")
                )
                  label = "ユニット・ゲスト楽曲";
                else if (cat.includes("cover")) label = "カバー楽曲";

                if (label) {
                  return (
                    <Link href={pathname} className={breadcrumbClasses.link}>
                      {cat.includes("original")
                        ? t("tabs.originals", { count: 0 }).replace(
                            /\s*\(0\)/,
                            "",
                          )
                        : cat.includes("collab") || cat.includes("unit")
                          ? t("tabs.unit", { count: 0 }).replace(/\s*\(0\)/, "")
                          : t("tabs.covers", { count: 0 }).replace(
                              /\s*\(0\)/,
                              "",
                            )}
                    </Link>
                  );
                }
              }
            } catch (e) {
              // ignore
            }
            return null;
          })()}
        </Breadcrumbs>

        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <p className={pageClasses.description}>
          {activeTab === 0
            ? t("tabDescriptions.originals")
            : activeTab === 1
              ? t("tabDescriptions.unit")
              : t("tabDescriptions.covers")}
        </p>

        <DiscographyControls
          groupByAlbum={groupByAlbum}
          groupByYear={groupByYear}
          onlyOriginalMV={onlyOriginalMV}
          activeTab={activeTab}
          onGroupByAlbumChange={handleGroupByAlbumChange}
          onGroupByYearChange={handleGroupByYearChange}
          onOnlyOriginalMVChange={handleOnlyOriginalMVChange}
        />

        <Tabs
          variant="none"
          value={String(activeTab)}
          onChange={(value) => {
            if (value !== null) {
              handleTabChange(Number(value));
            }
          }}
          keepMounted={false}
        >
          <Tabs.List
            ref={setTabsRootRef}
            className="relative mx-auto mb-4 flex w-fit max-w-full flex-nowrap overflow-x-auto rounded-lg border border-light-gray-200 bg-white/80 p-1 shadow-sm dark:border-white/10 dark:bg-gray-800/80"
          >
            <Tabs.Tab
              value="0"
              ref={tabRefCallbacks["0"]}
              className={discographyTabClass}
            >
              {t("tabs.originals", {
                count: Array.from(
                  new Set(
                    originalSongCountsByReleaseDate.map((s) => s.song.title),
                  ),
                ).length,
              })}
            </Tabs.Tab>
            <Tabs.Tab
              value="1"
              ref={tabRefCallbacks["1"]}
              className={discographyTabClass}
            >
              {t("tabs.unit", { count: unitSongCountsByReleaseDate.length })}
            </Tabs.Tab>
            <Tabs.Tab
              value="2"
              ref={tabRefCallbacks["2"]}
              className={discographyTabClass}
            >
              {t("tabs.covers", { count: coverSongCountsByReleaseDate.length })}
            </Tabs.Tab>
            <FloatingIndicator
              target={tabRefs[String(activeTab)]}
              parent={tabsRootRef}
              transitionDuration={220}
              className="z-0 rounded-md bg-primary-600 shadow-sm dark:bg-primary-500"
            />
          </Tabs.List>
          <>
            <Tabs.Panel value="0">
              <ContentRenderer
                data={originalSongCountsByReleaseDate}
                tabIndex={0}
                groupByAlbum={groupByAlbum}
                groupByYear={groupByYear}
                expandedItem={expandedItem}
                visibleItems={visibleItems[0] || []}
                anchorToScroll={anchorToScroll}
                targetRef={targetRef}
                onItemClick={handleItemClick}
              />
            </Tabs.Panel>
            <Tabs.Panel value="1">
              <ContentRenderer
                data={unitSongCountsByReleaseDate}
                tabIndex={1}
                groupByAlbum={groupByAlbum}
                groupByYear={groupByYear}
                expandedItem={expandedItem}
                visibleItems={visibleItems[1] || []}
                anchorToScroll={anchorToScroll}
                targetRef={targetRef}
                onItemClick={handleItemClick}
              />
            </Tabs.Panel>
            <Tabs.Panel value="2">
              <ContentRenderer
                data={coverSongCountsByReleaseDate}
                tabIndex={2}
                groupByAlbum={groupByAlbum}
                groupByYear={groupByYear}
                expandedItem={expandedItem}
                visibleItems={visibleItems[2] || []}
                anchorToScroll={anchorToScroll}
                targetRef={targetRef}
                onItemClick={handleItemClick}
              />
            </Tabs.Panel>
          </>
        </Tabs>
        <ScrollToTopButton />
      </div>
    </>
  );
}
