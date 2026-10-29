"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollArea,
  SegmentedControl,
  TableOfContents,
  Text,
} from "@mantine/core";
import { useReducedMotion, useViewportSize } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { usePageNavigationViewport } from "@/app/components/PageNavigationLayoutContext";
import type { BestNineResults } from "@/app/lib/bestNineTopics";
import type { BestNineChartType } from "@/app/lib/bestNineChartData";
import styles from "./topics.module.css";

export default function BestNineResultsNavigation({
  slots,
  fixedSlots,
  hasChart,
  chartType,
  onChartTypeChange,
}: {
  slots: BestNineResults["slots"];
  fixedSlots: boolean;
  hasChart: boolean;
  chartType: BestNineChartType;
  onChartTypeChange: (type: BestNineChartType) => void;
}) {
  const t = useTranslations("Share.myBest9.topics");
  const viewportRef = usePageNavigationViewport();
  const navigationRef = useRef<HTMLElement>(null);
  const reinitializeRef = useRef(() => {});
  const reducedMotion = useReducedMotion();
  const { width, height } = useViewportSize();
  const [spyOffset, setSpyOffset] = useState(0);
  const freeSlot = t("freeSlot");
  const combined = t("combinedRanking");
  const items = useMemo(
    () =>
      slots.map((slot) => ({
        id: `best-nine-slot-${slot.slot}`,
        depth: 2,
        value: fixedSlots
          ? `${slot.slot + 1}. ${slot.theme || freeSlot}`
          : combined,
      })),
    [slots, fixedSlots, freeSlot, combined],
  );

  useEffect(() => {
    // use-scroll-spyのoffsetはブラウザ座標。実際の本文viewportを基準にする。
    // PCのサイドエリアは本文の上を覆わない。上部に移る画面幅のみ高さを加算する。
    const occupiedHeight = navigationRef.current
      ? parseFloat(
          getComputedStyle(navigationRef.current).getPropertyValue(
            "--best-nine-navigation-height",
          ),
        ) || 0
      : 0;
    setSpyOffset(
      (viewportRef?.current?.getBoundingClientRect().top ?? 0) +
        occupiedHeight +
        32,
    );
  }, [viewportRef, width, height, hasChart, slots.length]);

  useEffect(() => {
    reinitializeRef.current();
  }, [items]);

  return (
    <aside
      ref={navigationRef}
      className={styles.resultsControls}
      aria-label={t("resultsControls")}
    >
      {hasChart && (
        <div className={styles.chartControls}>
          <Text size="sm" fw={600} className={styles.controlHeading}>
            {t("chartType")}
          </Text>
          <SegmentedControl
            size="xs"
            fullWidth
            value={chartType}
            aria-label={t("chartType")}
            data={(["pie", "bar", "treemap"] as const).map((value) => ({
              value,
              label: t(`chartTypes.${value}`),
            }))}
            onChange={(value) => {
              if (value === "pie" || value === "bar" || value === "treemap")
                onChartTypeChange(value);
            }}
          />
          <Text size="xs" c="dimmed" className={styles.chartScale}>
            {t("barScale")}
          </Text>
        </div>
      )}
      {slots.length > 1 && (
        <nav
          className={styles.sectionNavigation}
          aria-label={t("sectionNavigation")}
        >
          <Text size="sm" fw={600} className={styles.controlHeading}>
            {t("sectionNavigation")}
          </Text>
          <ScrollArea scrollbars="x" type="auto" scrollbarSize={4}>
            <TableOfContents
              size="sm"
              variant="light"
              minDepthToOffset={2}
              depthOffset={0}
              initialData={items}
              reinitializeRef={reinitializeRef}
              scrollSpyOptions={{
                selector: "[data-best-nine-result-heading]",
                scrollHost: viewportRef ?? undefined,
                offset: spyOffset,
              }}
              classNames={{
                root: styles.sectionToc,
                control: styles.sectionTocControl,
              }}
              getControlProps={({ data, active }) => ({
                children: data.value,
                title: data.value,
                "aria-current": active ? "location" : undefined,
                "aria-controls": data.id.replace(
                  "best-nine-slot-",
                  "best-nine-section-",
                ),
                onClick: () => {
                  const heading =
                    data.getNode() ?? document.getElementById(data.id);
                  const section = heading?.closest<HTMLElement>(
                    "[data-best-nine-section]",
                  );
                  if (!section) return;
                  section.scrollIntoView({
                    behavior: reducedMotion ? "auto" : "smooth",
                    block: "start",
                  });
                  section.focus({ preventScroll: true });
                },
              })}
            />
          </ScrollArea>
        </nav>
      )}
    </aside>
  );
}
