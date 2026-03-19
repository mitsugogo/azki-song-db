"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScrollIntoView } from "@mantine/hooks";
import { Breadcrumbs } from "@mantine/core";
import Link from "next/link";
import { breadcrumbClasses } from "../theme";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useDiscographyData } from "./hooks/useDiscographyData";
import DiscographyControls from "./components/DiscographyControls";
import ContentRenderer from "./components/ContentRenderer";
import { scrollToAnchor } from "./utils/scrollHelpers";
import Loading from "../loading";

const TAB_URLS = [
  "/discography",
  "/discography/originals",
  "/discography/collab",
  "/discography/covers",
];

const tabClass = ({ selected }: { selected: boolean }) =>
  `w-full rounded-lg py-1.5 md:py-2.5 text-xs md:text-sm font-medium leading-5 text-gray-700 dark:text-gray-300 ring-0 focus:ring-0 cursor-pointer ${
    selected
      ? "bg-white text-primary shadow dark:bg-gray-600 dark:text-white"
      : "hover:bg-white/12 hover:text-primary dark:hover:bg-gray-600 dark:hover:text-white"
  }`;

export default function DiscographyClient({
  initialTab = 0,
}: {
  initialTab?: number;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [groupByAlbum, setGroupByAlbum] = useState(true);
  const [groupByYear, setGroupByYear] = useState(false);
  const [onlyOriginalMV, setOnlyOriginalMV] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [anchorToScroll, setAnchorToScroll] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>([]);

  const { targetRef } = useScrollIntoView();
  const router = useRouter();

  const {
    loading,
    allSongCountsByReleaseDate,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  } = useDiscographyData(groupByAlbum, onlyOriginalMV);

  // アクティブタブのアイテム表示アニメーション
  useEffect(() => {
    const dataForTab = [
      allSongCountsByReleaseDate,
      originalSongCountsByReleaseDate,
      unitSongCountsByReleaseDate,
      coverSongCountsByReleaseDate,
    ];
    const data = dataForTab[activeTab] ?? [];
    setVisibleItems(new Array(data.length).fill(false));
    const timeout = setTimeout(() => {
      data.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
          });
        }, index * 50);
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, [
    activeTab,
    allSongCountsByReleaseDate,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  ]);

  useEffect(() => {
    if (!anchorToScroll) return;
    scrollToAnchor(anchorToScroll).finally(() => {
      setAnchorToScroll(null);
    });
  }, [anchorToScroll]);

  if (loading) {
    return <Loading />;
  }

  const handleItemClick = (key: string) => {
    if (key === expandedItem) {
      setExpandedItem(null);
      setAnchorToScroll(null);
      return;
    }
    setExpandedItem(key);
    setAnchorToScroll(key);
  };

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

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setExpandedItem(null);
    setAnchorToScroll(null);
    router.push(TAB_URLS[index]);
  };

  // DiscographyControls の activeTab は旧 3-tab 基準（0 = originals で "オリ曲MVのみ" 表示）
  // 新 4-tab: tab 1 = originals → controlsActiveTab = 0、それ以外は非表示
  const controlsActiveTab = activeTab - 1;

  const tabDataList = [
    allSongCountsByReleaseDate,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  ];

  return (
    <OverlayScrollbarsComponent
      element="div"
      className="lg:p-6 flex flex-col w-full h-full"
      options={{ scrollbars: { autoHide: "leave" } }}
      defer
    >
      <Breadcrumbs
        aria-label="Breadcrumb"
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="w-4 h-4 mr-1.5" /> Home
        </Link>
        <Link href="/discography" className={breadcrumbClasses.link}>
          楽曲一覧
        </Link>
      </Breadcrumbs>

      <h1 className="font-extrabold text-2xl p-3 mb-2">Discography</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        これまでに配信された楽曲の一覧です。オリ曲、コラボ楽曲、カバー楽曲などをまとめています。
      </p>

      <DiscographyControls
        groupByAlbum={groupByAlbum}
        groupByYear={groupByYear}
        onlyOriginalMV={onlyOriginalMV}
        activeTab={controlsActiveTab}
        onGroupByAlbumChange={handleGroupByAlbumChange}
        onGroupByYearChange={handleGroupByYearChange}
        onOnlyOriginalMVChange={handleOnlyOriginalMVChange}
      />

      <TabGroup selectedIndex={activeTab} onChange={handleTabChange}>
        <TabList className="flex space-x-1 rounded-xl bg-gray-50/20 dark:bg-gray-800 p-1 mb-4">
          <Tab as="button" className={tabClass}>
            すべて ({allSongCountsByReleaseDate.length})
          </Tab>
          <Tab as="button" className={tabClass}>
            オリジナル楽曲 ({originalSongCountsByReleaseDate.length})
          </Tab>
          <Tab as="button" className={tabClass}>
            ユニット・ゲスト楽曲 ({unitSongCountsByReleaseDate.length})
          </Tab>
          <Tab as="button" className={tabClass}>
            カバー楽曲 ({coverSongCountsByReleaseDate.length})
          </Tab>
        </TabList>
        <TabPanels>
          {tabDataList.map((data, tabIndex) => (
            <TabPanel key={tabIndex}>
              <ContentRenderer
                data={data}
                tabIndex={tabIndex}
                groupByAlbum={groupByAlbum}
                groupByYear={groupByYear}
                expandedItem={expandedItem}
                visibleItems={activeTab === tabIndex ? visibleItems : []}
                anchorToScroll={anchorToScroll}
                targetRef={targetRef}
                onItemClick={handleItemClick}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </OverlayScrollbarsComponent>
  );
}
