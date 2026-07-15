"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useScrollIntoView } from "@mantine/hooks";
import { ScrollToTopButton } from "../components/ScrollToTopButton";
import { Breadcrumbs, FloatingIndicator, Tabs } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "../theme";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { useDiscographyData } from "./hooks/useDiscographyData";
import DiscographyControls from "./components/DiscographyControls";
import ContentRenderer from "./components/ContentRenderer";
import { scrollToAnchor } from "./utils/scrollHelpers";
import Loading from "../loading";
import { useTranslations } from "next-intl";

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
  const [indicatorTab, setIndicatorTab] = useState(initialTab);
  const [groupByAlbum, setGroupByAlbum] = useState(true);
  const [groupByYear, setGroupByYear] = useState(false);
  const [onlyOriginalMV, setOnlyOriginalMV] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [anchorToScroll, setAnchorToScroll] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<boolean[]>([]);
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
  } = useDiscographyData(groupByAlbum, onlyOriginalMV);

  useEffect(() => {
    setActiveTab(initialTab);
    setIndicatorTab(initialTab);
    setExpandedItem(null);
    setAnchorToScroll(null);
  }, [initialTab]);

  // アクティブタブのアイテム表示アニメーション
  useEffect(() => {
    const dataForTab = [
      allSongCountsByReleaseDate,
      originalSongCountsByReleaseDate,
      unitSongCountsByReleaseDate,
      overallSongCountsByReleaseDate,
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
    overallSongCountsByReleaseDate,
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
    const destination = TAB_URLS[index];

    setIndicatorTab(index);
    setExpandedItem(null);
    setAnchorToScroll(null);

    if (destination && pathname !== destination) {
      router.push(destination);
      return;
    }

    setActiveTab(index);
  };

  // DiscographyControls の activeTab は旧 3-tab 基準（0 = originals で "オリ曲MVのみ" 表示）
  // 新 4-tab: tab 1 = originals → controlsActiveTab = 0、それ以外は非表示
  const controlsActiveTab = activeTab - 1;

  const tabDataList = [
    allSongCountsByReleaseDate,
    originalSongCountsByReleaseDate,
    unitSongCountsByReleaseDate,
    overallSongCountsByReleaseDate,
    coverSongCountsByReleaseDate,
  ];

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
          onlyOriginalMV={onlyOriginalMV}
          activeTab={controlsActiveTab}
          onGroupByAlbumChange={handleGroupByAlbumChange}
          onGroupByYearChange={handleGroupByYearChange}
          onOnlyOriginalMVChange={handleOnlyOriginalMVChange}
        />

        <Tabs
          variant="none"
          value={String(indicatorTab)}
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
              {t("tabs.all", { count: tabCounts.all })}
            </Tabs.Tab>
            <Tabs.Tab
              value="1"
              ref={tabRefCallbacks["1"]}
              className={discographyTabClass}
            >
              {t("tabs.originals", {
                count: tabCounts.originals,
              })}
            </Tabs.Tab>
            <Tabs.Tab
              value="2"
              ref={tabRefCallbacks["2"]}
              className={discographyTabClass}
            >
              {t("tabs.unit", { count: tabCounts.unit })}
            </Tabs.Tab>
            <Tabs.Tab
              value="3"
              ref={tabRefCallbacks["3"]}
              className={discographyTabClass}
            >
              {t("tabs.overall", { count: tabCounts.overall })}
            </Tabs.Tab>
            <Tabs.Tab
              value="4"
              ref={tabRefCallbacks["4"]}
              className={discographyTabClass}
            >
              {t("tabs.covers", { count: tabCounts.covers })}
            </Tabs.Tab>
            <FloatingIndicator
              target={tabRefs[String(indicatorTab)]}
              parent={tabsRootRef}
              transitionDuration={220}
              className="z-0 rounded-md bg-primary-600 shadow-sm dark:bg-primary-500"
            />
          </Tabs.List>
        </Tabs>
        <ContentRenderer
          data={tabDataList[activeTab] ?? []}
          tabIndex={activeTab}
          groupByAlbum={groupByAlbum}
          groupByYear={groupByYear}
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
