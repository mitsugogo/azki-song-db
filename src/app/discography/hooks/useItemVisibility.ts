import { useState, useEffect } from "react";
import { StatisticsItem } from "../createStatistics";

/**
 * アイテムの表示アニメーション管理用カスタムフック
 */
export function useItemVisibility(
  activeTab: number,
  originalItems: StatisticsItem[],
  unitItems: StatisticsItem[],
  coverItems: StatisticsItem[],
) {
  const [visibleItems, setVisibleItems] = useState<boolean[][]>([[], [], []]);

  useEffect(() => {
    const itemsArray = [originalItems, unitItems, coverItems];
    const itemsToAnimate = itemsArray[activeTab];

    setVisibleItems((prev) => {
      const next = [...prev];
      next[activeTab] = new Array(itemsToAnimate.length).fill(false);
      return next;
    });

    setTimeout(() => {
      itemsToAnimate.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => {
            const next = [...prev];
            if (Array.isArray(next[activeTab])) {
              const nextInner = [...next[activeTab]];
              nextInner[index] = true;
              next[activeTab] = nextInner;
            }
            return next;
          });
        }, index * 50);
      });
    }, 100);
  }, [activeTab, originalItems, unitItems, coverItems]);

  return visibleItems;
}
