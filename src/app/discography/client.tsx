"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useScrollIntoView } from "@mantine/hooks";
import { Breadcrumb, BreadcrumbItem } from "flowbite-react";
import { HiHome } from "react-icons/hi";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";

import { useDiscographyData } from "./hooks/useDiscographyData";
import { useItemVisibility } from "./hooks/useItemVisibility";
import { useAlbumNavigation } from "./hooks/useAlbumNavigation";
import DiscographyControls from "./components/DiscographyControls";
import ContentRenderer from "./components/ContentRenderer";
import { scrollToAnchor } from "./utils/scrollHelpers";

export default function DiscographyPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [groupByAlbum, setGroupByAlbum] = useState(true);
  const [groupByYear, setGroupByYear] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [onlyOriginalMV, setOnlyOriginalMV] = useState(false);
  const [anchorToScroll, setAnchorToScroll] = useState<string | null>(null);

  const { targetRef } = useScrollIntoView();
  const skipClearOnTabChange = useRef(false);
  const searchParams = useSearchParams();

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

  // URLパラメータに基づくアルバムナビゲーション
  useAlbumNavigation({
    loading,
    songs,
    searchParams,
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
  };

  return (
    <OverlayScrollbarsComponent
      element="div"
      className="lg:p-6 flex flex-col w-full h-full"
      options={{ scrollbars: { autoHide: "leave" } }}
      defer
    >
      <Breadcrumb aria-label="Breadcrumb" className="mb-3">
        <BreadcrumbItem href="/">
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </BreadcrumbItem>
        <BreadcrumbItem>楽曲一覧</BreadcrumbItem>
      </Breadcrumb>

      <h1 className="font-extrabold text-2xl p-3 mb-2">Discography</h1>

      <DiscographyControls
        groupByAlbum={groupByAlbum}
        groupByYear={groupByYear}
        onlyOriginalMV={onlyOriginalMV}
        activeTab={activeTab}
        onGroupByAlbumChange={handleGroupByAlbumChange}
        onGroupByYearChange={handleGroupByYearChange}
        onOnlyOriginalMVChange={handleOnlyOriginalMVChange}
      />

      <TabGroup selectedIndex={activeTab} onChange={handleTabChange}>
        <TabList className="flex space-x-1 rounded-xl bg-gray-50/20 dark:bg-gray-800 p-1 mb-4">
          <Tab
            as="button"
            onClick={() => {
              setActiveTab(0);
              setExpandedItem(null);
            }}
            className={({ selected }) =>
              `w-full rounded-lg py-1.5 md:py-2.5 text-xs md:text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 ring-0 forcus:ring-0 cursor-pointer
              ${
                selected
                  ? "bg-white text-primary shadow dark:bg-gray-600 dark:text-white"
                  : "hover:bg-white/12 hover:text-primary dark:hover:bg-gray-600 dark:hover:text-white"
              }`
            }
          >
            オリジナル楽曲 (
            {
              Array.from(
                new Set(
                  originalSongCountsByReleaseDate.map((s) => s.song.title),
                ),
              ).length
            }
            )
          </Tab>
          <Tab
            as="button"
            onClick={() => {
              setActiveTab(1);
              setExpandedItem(null);
            }}
            className={({ selected }) =>
              `w-full rounded-lg py-1.5 md:py-2.5 text-xs md:text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 ring-0 forcus:ring-0 cursor-pointer
              ${
                selected
                  ? "bg-white text-primary shadow dark:bg-gray-600 dark:text-white"
                  : "hover:bg-white/12 hover:text-primary dark:hover:bg-gray-600 dark:hover:text-white"
              }`
            }
          >
            ユニット・ゲスト楽曲 ({unitSongCountsByReleaseDate.length})
          </Tab>
          <Tab
            as="button"
            onClick={() => {
              setActiveTab(2);
              setExpandedItem(null);
            }}
            className={({ selected }) =>
              `w-full rounded-lg py-1.5 md:py-2.5 text-xs md:text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 ring-0 forcus:ring-0 cursor-pointer
              ${
                selected
                  ? "bg-white text-primary shadow dark:bg-gray-600 dark:text-white"
                  : "hover:bg-white/12 hover:text-primary dark:hover:bg-gray-600 dark:hover:text-white"
              }`
            }
          >
            カバー楽曲 ({coverSongCountsByReleaseDate.length})
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
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
          </TabPanel>
          <TabPanel>
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
          </TabPanel>
          <TabPanel>
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
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </OverlayScrollbarsComponent>
  );
}
