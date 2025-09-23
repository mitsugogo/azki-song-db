import { useEffect, Dispatch, SetStateAction, RefObject } from "react";
import { TabsRef } from "flowbite-react";

export function useTabSync(
  tabsRef: RefObject<TabsRef | null>,
  setActiveTab: Dispatch<SetStateAction<number>>
) {
  // URLクエリパラメータからタブを初期化
  useEffect(() => {
    const url = new URL(window.location.href);
    const tab = url.searchParams.get("tab");
    if (tab) {
      const tabIndex = parseInt(tab, 10);
      tabsRef.current?.setActiveTab(tabIndex);
      setActiveTab(tabIndex);
    }
  }, []);

  // ブラウザの履歴（戻る/進む）操作を監視
  useEffect(() => {
    const handlePopState = () => {
      const newUrl = new URL(window.location.href);
      const newTab = newUrl.searchParams.get("tab");
      if (newTab) {
        const tabIndex = parseInt(newTab, 10);
        tabsRef.current?.setActiveTab(tabIndex);
        setActiveTab(tabIndex);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
}
