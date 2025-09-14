"use client";

import {
  useRef,
  useState,
  useDeferredValue,
  useEffect,
  ReactNode,
} from "react";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import DataTable from "./datatable";
import { useSongData } from "../hook/useSongData";
import { useStatistics } from "../hook/useStatistics";
import { TABS_CONFIG } from "./tabsConfig";

// `useTabSync` and `TabsRef` are not needed with `headlessui`'s state-driven approach.

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const deferredActiveTab = useDeferredValue(activeTab);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const { songs, coverSongInfo, originalSongInfo, loading } = useSongData();

  const statistics = useStatistics({
    songs,
    coverSongInfo,
    originalSongInfo,
  });

  const handleVideoClick = (videoId: string) => {
    setSelectedVideoId((prev) => (prev === videoId ? null : videoId));
  };

  const handleTabChange = (tabIndex: number) => {
    setActiveTab(tabIndex);

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabIndex.toString());
    window.history.pushState(null, "", url.href);
  };

  // ページを開いた時にURLの"tab"を取得してタブを選択する
  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    if (tab) {
      const tabIndex = parseInt(tab, 10);
      setActiveTab(tabIndex);
      // スクロール
      const tabElement = document.getElementById(`tab-${tabIndex}`);
      if (tabElement) {
        tabElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  return (
    <div className="flex-grow lg:p-6 lg:pb-0">
      <h1 className="font-extrabold text-2xl p-3 dark:text-gray-200">
        統計情報
      </h1>

      <TabGroup selectedIndex={activeTab} onChange={handleTabChange}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <TabList className="flex whitespace-nowrap overflow-y-scroll lg:overflow-auto">
            {TABS_CONFIG.map((tab) => (
              <Tab
                id={`tab-${TABS_CONFIG.indexOf(tab)}`}
                key={`${tab.title}-${tab.dataKey}-header`}
                className={({ selected }) =>
                  `flex items-center justify-center p-4 font-medium text-sm border-b-2 focus:outline-none transition-colors duration-200 cursor-pointer
                   ${
                     selected
                       ? "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500"
                       : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                   }`
                }
              >
                {tab.icon && (
                  <span className="mr-2">
                    <tab.icon />
                  </span>
                )}
                {tab.title}
              </Tab>
            ))}
          </TabList>
        </div>
        <TabPanels>
          {TABS_CONFIG.map((tab, index) => (
            <TabPanel key={`${tab.title}-${index}-panel`}>
              {deferredActiveTab === index && (
                <DataTable
                  loading={loading}
                  data={statistics[tab.dataKey]}
                  caption={tab.caption}
                  description={tab.description}
                  columns={tab.columns}
                  initialSortColumnId={tab.initialSort.id}
                  initialSortDirection={tab.initialSort.direction}
                  {...(tab.dataKey === "videoCounts" && {
                    onRowClick: handleVideoClick,
                    selectedVideoId: selectedVideoId,
                    songs: songs,
                  })}
                />
              )}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}
