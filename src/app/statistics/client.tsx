"use client";

import { useRef, useState, useDeferredValue, useEffect } from "react";
import { TabItem, Tabs, TabsRef } from "flowbite-react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

import DataTable from "./datatable"; // DataTableを別ファイルに分離 (変更なしと仮定)
import { useSongData } from "../hook/useSongData";
import { useStatistics } from "../hook/useStatistics";
import { useTabSync } from "../hook/useTabSync";
import { TABS_CONFIG } from "./tabsConfig";

export default function StatisticsPage() {
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);
  const deferredActiveTab = useDeferredValue(activeTab);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // カスタムフックでデータ取得とローディング状態を管理
  const { songs, coverSongInfo, originalSongInfo, loading } = useSongData();

  // カスタムフックで統計データを計算
  const statistics = useStatistics({
    songs,
    coverSongInfo,
    originalSongInfo,
  });

  // カスタムフックでタブの状態とURLを同期
  useTabSync(tabsRef, setActiveTab);

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
    }
  }, []);

  return (
    <div className="flex-grow lg:p-6 lg:pb-0">
      <h1 className="font-extrabold text-2xl p-3 dark:text-gray-200">
        統計情報
      </h1>

      <Tabs
        aria-label="統計タブ"
        variant="underline"
        ref={tabsRef}
        onActiveTabChange={handleTabChange}
      >
        {TABS_CONFIG.map((tab, index) => (
          <TabItem key={tab.title} title={tab.title} icon={tab.icon}>
            {deferredActiveTab === index && (
              <DataTable
                loading={loading}
                data={statistics[tab.dataKey]}
                caption={tab.caption}
                description={tab.description}
                columns={tab.columns}
                initialSortColumnId={tab.initialSort.id}
                initialSortDirection={tab.initialSort.direction}
                // 収録動画タブでのみ使用するProps
                {...(tab.dataKey === "videoCounts" && {
                  onRowClick: handleVideoClick,
                  selectedVideoId: selectedVideoId,
                  songs: songs,
                })}
              />
            )}
          </TabItem>
        ))}
      </Tabs>
    </div>
  );
}
