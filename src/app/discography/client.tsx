"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useScrollIntoView } from "@mantine/hooks";
import { ScrollToTopButton } from "../components/ScrollToTopButton";
import { Breadcrumbs, FloatingIndicator, Tabs } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "../theme";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { useDiscographyData } from "./hooks/useDiscographyData";
import DiscographyControls from "./components/DiscographyControls";
import type { DiscographyViewMode } from "./components/DiscographyControls";
import ContentRenderer from "./components/ContentRenderer";
import { scrollToAnchor } from "./utils/scrollHelpers";
import Loading from "../loading";
import { useTranslations } from "next-intl";
import { usePersistedDiscographyViewMode } from "./hooks/usePersistedDiscographyViewMode";

const TAB_URLS = [
  "/discography",
  "/discography/originals",
  "/discography/collab",
  "/discography/overall",
  "/discography/covers",
];
const TAB_VALUES = ["0", "1", "2", "3", "4"] as const;

const discographyTabClass =
  "relative z-10 shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold leading-5 text-gray-700 transition-colors hover:text-primary data-[active=true]:text-white dark:text-gray-200 dark:hover:text-pink-200 dark:data-[active=true]:text-white md:px-4 md:py-2 md:text-sm";

export default function DiscographyClient({
  initialTab = 0,
}: {
  initialTab?: number;
}) {
  const t = useTranslations("Discography");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [groupByAlbum, setGroupByAlbum] = useState(true);
  const [groupByYear, setGroupByYear] = useState(false);
  const [viewMode, setViewMode] = usePersistedDiscographyViewMode(
    activeTab === 1,
  );
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
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
  const router = useRouter();
  const pathname = usePathname();

  const {
    loading,
    allSongCountsByReleaseDate,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    overallSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
    tabCounts,
  } = useDiscographyData(groupByAlbum, viewMode === "originalMv");

  useEffect(() => {
    setActiveTab(initialTab);
    setExpandedItem(null);
    setAnchorToScroll(null);
  }, [initialTab]);

  const tabDataList = [
    allSongCountsByReleaseDate,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    overallSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  ];
  const activeData = tabDataList[activeTab] ?? allSongCountsByReleaseDate;
  // 項目ごとのタイマーで一覧全体を再描画せず、取得済みデータを一度で表示する。
  const visibleItems = useMemo(() => activeData.map(() => true), [activeData]);

  const handleItemClick = useCallback(
    (key: string) => {
      const next = expandedItem === key ? null : key;
      setExpandedItem(next);
      setAnchorToScroll(next);
    },
    [expandedItem],
  );

  useEffect(() => {
    if (!anchorToScroll) return;
    scrollToAnchor(anchorToScroll).finally(() => {
      setAnchorToScroll(null);
    });
  }, [anchorToScroll]);

  if (loading) {
    return <Loading />;
  }

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

  const handleViewModeChange = (mode: DiscographyViewMode) => {
    setViewMode(mode);
    setExpandedItem(null);
    setAnchorToScroll(null);
  };

  const handleTabChange = (index: number) => {
    const destination = TAB_URLS[index];

    setActiveTab(index);
    setExpandedItem(null);
    setAnchorToScroll(null);

    // 遷移完了前に元のタブへ戻した場合も、直前の遷移を置き換える。
    if (destination && (pathname !== destination || activeTab !== index)) {
      router.push(destination, { scroll: false });
    }
  };

  const prefetchTab = (index: number) => {
    const destination = TAB_URLS[index];
    if (destination && pathname !== destination) {
      router.prefetch(destination);
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
        </Breadcrumbs>

        <h1 className={pageClasses.heading}>{t("title")}</h1>
        <p className={pageClasses.description}>{t("description")}</p>

        <DiscographyControls
          groupByAlbum={groupByAlbum}
          groupByYear={groupByYear}
          viewMode={viewMode}
          showOriginalMv={activeTab === 1}
          onGroupByAlbumChange={handleGroupByAlbumChange}
          onGroupByYearChange={handleGroupByYearChange}
          onViewModeChange={handleViewModeChange}
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
              onMouseEnter={() => prefetchTab(0)}
              onFocus={() => prefetchTab(0)}
              ref={tabRefCallbacks["0"]}
              className={discographyTabClass}
            >
              {t("tabs.all", { count: tabCounts.all })}
            </Tabs.Tab>
            <Tabs.Tab
              value="1"
              onMouseEnter={() => prefetchTab(1)}
              onFocus={() => prefetchTab(1)}
              ref={tabRefCallbacks["1"]}
              className={discographyTabClass}
            >
              {t("tabs.originals", {
                count: tabCounts.originals,
              })}
            </Tabs.Tab>
            <Tabs.Tab
              value="2"
              onMouseEnter={() => prefetchTab(2)}
              onFocus={() => prefetchTab(2)}
              ref={tabRefCallbacks["2"]}
              className={discographyTabClass}
            >
              {t("tabs.unit", { count: tabCounts.unit })}
            </Tabs.Tab>
            <Tabs.Tab
              value="3"
              onMouseEnter={() => prefetchTab(3)}
              onFocus={() => prefetchTab(3)}
              ref={tabRefCallbacks["3"]}
              className={discographyTabClass}
            >
              {t("tabs.overall", { count: tabCounts.overall })}
            </Tabs.Tab>
            <Tabs.Tab
              value="4"
              onMouseEnter={() => prefetchTab(4)}
              onFocus={() => prefetchTab(4)}
              ref={tabRefCallbacks["4"]}
              className={discographyTabClass}
            >
              {t("tabs.covers", { count: tabCounts.covers })}
            </Tabs.Tab>
            <FloatingIndicator
              target={tabRefs[String(activeTab)]}
              parent={tabsRootRef}
              transitionDuration={220}
              className="z-0 rounded-md bg-primary-600 shadow-sm dark:bg-primary-500"
            />
          </Tabs.List>
        </Tabs>
        <ContentRenderer
          data={activeData}
          tabIndex={activeTab}
          groupByAlbum={groupByAlbum}
          groupByYear={groupByYear}
          viewMode={viewMode}
          expandedItem={expandedItem}
          visibleItems={visibleItems}
          anchorToScroll={anchorToScroll}
          targetRef={targetRef}
          onItemClick={handleItemClick}
        />
        <ScrollToTopButton />
      </div>
    </>
  );
}
