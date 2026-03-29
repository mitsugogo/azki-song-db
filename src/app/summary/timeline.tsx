"use client";

import { Link } from "@/i18n/navigation";
import { ROUTE_RANGES } from "../config/timelineRoutes";
import { VISUAL_CHANGES } from "../config/timelineVisuals";
import { Song } from "../types/song";
import useMilestones from "../hook/useMilestones";
import { Badge } from "@mantine/core";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useTranslations, useLocale } from "next-intl";
import { useRef, useState, useLayoutEffect } from "react";
import { formatDate } from "../lib/formatDate";

type TimelineMilestone = {
  date: Date;
  text: string;
  note: string;
  url: string;
  is_external: boolean;
};

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Timeline({ songs }: { songs: Song[] }) {
  const t = useTranslations("Summary");
  const activityStart = new Date(2018, 10, 15);

  const msPerDay = 1000 * 60 * 60 * 24;

  const { items: externalMilestones } = useMilestones();

  const songMilestones = songs
    .filter((s) => s.milestones && s.milestones.length > 0 && s.broadcast_at)
    .flatMap((s) =>
      (s.milestones || []).map((m: string) => ({
        date: new Date(s.broadcast_at),
        text: m.trim(),
        note: "",
        url: "",
        is_external: false,
      })),
    );

  // 同じ milestone text が複数日付で出現する場合は、最も早い日付のみを利用
  const dedupedSongMilestones = Array.from(
    songMilestones
      .reduce((map, milestone) => {
        const key = milestone.text;
        const existing = map.get(key);
        if (!existing || milestone.date.getTime() < existing.date.getTime()) {
          map.set(key, milestone);
        }
        return map;
      }, new Map<string, TimelineMilestone>())
      .values(),
  );

  const apiMilestones: TimelineMilestone[] = (externalMilestones || [])
    .map((m) => ({
      date: m.date ? new Date(m.date) : null,
      text: m.content?.trim() || "",
      note: m.note || "",
      url: m.url || "",
      is_external: true, // APIからのマイルストーンかどうか
    }))
    .filter((m): m is TimelineMilestone => Boolean(m.date && m.text));

  const allMilestones: TimelineMilestone[] = [
    ...dedupedSongMilestones,
    ...apiMilestones,
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const uniqueMilestones = (() => {
    const map = new Map<string, TimelineMilestone>();

    for (const m of allMilestones) {
      const key = `${toDateKey(m.date)}::${m.text}`;
      const prev = map.get(key);

      if (!prev) {
        map.set(key, m);
        continue;
      }

      map.set(key, {
        ...prev,
        note: prev.note || m.note,
        url: prev.url || m.url,
        is_external: prev.is_external || m.is_external,
      });
    }
    return Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  })();

  const locale = useLocale();
  const isJP = locale === "ja";

  // バンドと帯の位置合わせのため、実際のレンダリング後に各行の上端y座標を計測する
  const flexContainerRef = useRef<HTMLDivElement>(null);
  const [measuredPositions, setMeasuredPositions] = useState<number[] | null>(
    null,
  );
  const [measuredBandHeight, setMeasuredBandHeight] = useState<number | null>(
    null,
  );

  useLayoutEffect(() => {
    const container = flexContainerRef.current;
    if (!container) return;

    const measure = () => {
      const parentTop = container.getBoundingClientRect().top;
      const items = container.querySelectorAll<HTMLElement>(
        "[data-milestone-idx]",
      );
      if (items.length === 0) return;

      const positions: number[] = [];
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        positions.push(rect.top - parentTop); // 上端を基準
      });
      setMeasuredPositions(positions);
      setMeasuredBandHeight(container.offsetHeight);
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });
    resizeObserver.observe(container);

    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [uniqueMilestones.length]);

  return (
    <>
      <div
        key="timeline"
        className="col-span-full mt-6 p-3 border-t pb-20 lg:pb-24"
      >
        <h2 className="font-bold text-xl mb-2">{t("timelineTitle")}</h2>
        {(() => {
          const start = activityStart;
          const end = new Date(
            Math.max(
              uniqueMilestones[uniqueMilestones.length - 1]?.date?.getTime() ??
                Date.now(),
              Date.now(),
            ),
          );
          end.setHours(23, 59, 59, 999);
          const totalRange = Math.max(1, end.getTime() - start.getTime());

          // 1日あたりのpx（帯の位置計算用）
          const pxPerDay = 0.55;
          // 推定行高さ（帯の位置計算に使用する近似値）
          const estimatedItemHeight = 30;
          const topPadding = 12;
          const bottomPadding = 48;

          // アイテム間スペーサー高さ（日数差に比例、余白がない場合は0）
          const spacers = uniqueMilestones.slice(0, -1).map((m, i) => {
            const next = uniqueMilestones[i + 1];
            const days = (next.date.getTime() - m.date.getTime()) / msPerDay;
            return Math.max(0, days * pxPerDay - estimatedItemHeight);
          });

          const totalSpacerHeight = spacers.reduce((a, b) => a + b, 0);
          // 帯の高さ計算用（実際のコンテンツ高さの近似）
          const timelineHeight = Math.max(
            800,
            topPadding +
              uniqueMilestones.length * estimatedItemHeight +
              totalSpacerHeight +
              bottomPadding,
          );
          const endTime = end.getTime();

          // 各マイルストーンの実際のy座標（行の上端）を事前計算
          const itemPositions: number[] = [];
          let cumY = topPadding;
          for (let i = 0; i < uniqueMilestones.length; i++) {
            itemPositions.push(cumY);
            if (i < spacers.length) {
              cumY += estimatedItemHeight + spacers[i];
            }
          }
          const bandHeight = Math.max(
            timelineHeight,
            cumY + estimatedItemHeight + bottomPadding,
          );

          const effectivePositions =
            measuredPositions?.length === uniqueMilestones.length
              ? measuredPositions
              : itemPositions;
          const effectiveBandHeight = measuredBandHeight ?? bandHeight;

          // 日付をy座標に変換（マイルストーン上端にスナップ/補間）
          const dateToY = (ts: number): number => {
            const n = uniqueMilestones.length;
            if (n === 0) return topPadding;

            const firstDate = uniqueMilestones[0].date.getTime();
            const lastDate = uniqueMilestones[n - 1].date.getTime();

            if (ts <= firstDate) return effectivePositions[0];
            if (ts >= lastDate) return effectivePositions[n - 1];

            const sameIndex = uniqueMilestones.findIndex(
              (m) => m.date.getTime() === ts,
            );
            if (sameIndex >= 0) {
              return effectivePositions[sameIndex];
            }

            for (let i = 0; i < n - 1; i++) {
              const t0 = uniqueMilestones[i].date.getTime();
              const t1 = uniqueMilestones[i + 1].date.getTime();
              if (ts > t0 && ts < t1) {
                const ratio = (ts - t0) / Math.max(1, t1 - t0);
                return (
                  effectivePositions[i] +
                  ratio * (effectivePositions[i + 1] - effectivePositions[i])
                );
              }
            }

            return effectivePositions[n - 1];
          };

          // 帯セグメントのpx位置を計算するヘルパー（実際のマイルストーン位置に合わせる）
          const calcBand = (segStart: number, segEnd: number) => {
            const topPx = dateToY(segStart);
            const reachesEnd = segEnd >= endTime - 1;
            const bottomPx = reachesEnd ? effectiveBandHeight : dateToY(segEnd);
            const heightPx = Math.max(6, bottomPx - topPx);
            return { topPx, heightPx };
          };

          const routeRanges = ROUTE_RANGES.map((r) => {
            const from = new Date(r.from).setHours(0, 0, 0, 0);
            const to = r.to
              ? new Date(r.to).setHours(23, 59, 59, 999)
              : Infinity;
            const label = (r as any).labelKey
              ? t((r as any).labelKey)
              : r.label;
            return { label, from, to };
          });

          const overlaps = routeRanges.map((r) => {
            const segStart = Math.max(r.from, start.getTime());
            const segEnd = Math.min(r.to, end.getTime());
            const dur = Math.max(0, segEnd - segStart);
            return { ...r, segStart, segEnd, dur };
          });

          const colors = [
            ["rgba(99,102,241,0.12)", "rgba(99,102,241,0.6)"],
            ["rgba(16,185,129,0.12)", "rgba(16,185,129,0.6)"],
            ["rgba(234,88,12,0.12)", "rgba(234,88,12,0.6)"],
            ["rgba(219,39,119,0.12)", "rgba(219,39,119,0.6)"],
          ];

          const visualRanges = VISUAL_CHANGES.map((v) => {
            const from = new Date(v.from).setHours(0, 0, 0, 0);
            const to = v.to
              ? new Date(v.to).setHours(23, 59, 59, 999)
              : Infinity;
            const label = (v as any).labelKey
              ? t((v as any).labelKey)
              : v.label;
            return { label, from, to, color: v.color };
          });

          const visualOverlaps = visualRanges.map((r) => {
            const segStart = Math.max(r.from, start.getTime());
            const segEnd = Math.min(r.to, end.getTime());
            const dur = Math.max(0, segEnd - segStart);
            return { ...r, segStart, segEnd, dur };
          });

          // 帯ラベルの共通スタイル
          const bandLabelStyle = isJP
            ? {
                writingMode: "vertical-rl" as const,
                textOrientation: "upright" as const,
              }
            : {
                transform: "rotate(90deg)",
                transformOrigin: "center",
                display: "inline-block",
                whiteSpace: "nowrap" as const,
              };

          return (
            // min-height で縦積みコンテンツが帯より長くなっても溢れない
            <div
              ref={flexContainerRef}
              className="flex"
              style={{ minHeight: bandHeight }}
            >
              {/* ルート帯 */}
              <div className="w-6 sm:w-12 relative mr-1 sm:mr-2 shrink-0">
                {overlaps.map((o, i) => {
                  if (o.dur === 0) return null;
                  const { topPx, heightPx } = calcBand(o.segStart, o.segEnd);
                  return (
                    <div
                      key={o.label}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: topPx,
                        height: heightPx,
                      }}
                      className="flex items-center justify-center"
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: `linear-gradient(to bottom, ${colors[i][0]}, ${colors[i][1]})`,
                          clipPath:
                            "polygon(0% 0%, 100% 0%, 100% 90%, 50% 100%, 0% 90%)",
                          opacity: 0.3,
                        }}
                      />
                      <div
                        style={bandLabelStyle}
                        className="text-xs text-center text-light-gray-500 dark:text-light-gray-400 z-10"
                      >
                        {o.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 衣装帯 */}
              <div className="w-6 sm:w-12 relative mr-1 sm:mr-2 shrink-0">
                {visualOverlaps.map((o) => {
                  if (o.dur === 0) return null;
                  const { topPx, heightPx } = calcBand(o.segStart, o.segEnd);
                  return (
                    <div
                      key={o.label}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: topPx,
                        height: heightPx,
                      }}
                      className="flex items-center justify-center"
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: `linear-gradient(to bottom, ${o.color}, ${o.color}80)`,
                          clipPath:
                            "polygon(0% 0%, 100% 0%, 100% 90%, 50% 100%, 0% 90%)",
                          opacity: 0.3,
                        }}
                      />
                      <div
                        style={bandLabelStyle}
                        className="text-xs text-center text-light-gray-500 dark:text-light-gray-400 z-10"
                      >
                        {o.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* マイルストーン縦積みリスト */}
              <div className="flex-1" style={{ paddingTop: topPadding }}>
                {uniqueMilestones.map((m, idx) => {
                  const daysSince =
                    Math.floor(
                      (m.date.getTime() - activityStart.getTime()) / msPerDay,
                    ) + 1;
                  return (
                    <div key={idx}>
                      <div
                        data-milestone-idx={idx}
                        className="flex items-start justify-between text-sm text-light-gray-600 dark:text-light-gray-400 hover:bg-light-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs text-light-gray-500 dark:text-light-gray-500 whitespace-nowrap">
                            {formatDate(m.date, locale)}
                          </span>{" "}
                          —{" "}
                          <Link
                            href={m.url ? m.url : `/?q=milestone:${m.text}`}
                            className="text-primary"
                            target={m.url ? "_blank" : undefined}
                          >
                            {m.text}
                          </Link>
                          {m.note ? (
                            <span className="ml-2 text-sm text-light-gray-600 dark:text-light-gray-400">
                              {m.note}
                            </span>
                          ) : null}
                          {m.url ? (
                            <Badge
                              component="a"
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="gray"
                              radius="sm"
                              className="ml-2"
                            >
                              <FaExternalLinkAlt className="inline -mt-1 mr-0.5" />{" "}
                              URL
                            </Badge>
                          ) : null}
                        </div>
                        <div className="hidden sm:block pr-2 text-right whitespace-nowrap shrink-0">
                          {t("daysActiveLabel")}{" "}
                          <span className="font-semibold">{daysSince}</span>
                          {t("daysSuffix")}
                        </div>
                      </div>
                      {/* 次アイテムまでの日数に比例したスペーサー */}
                      {idx < uniqueMilestones.length - 1 &&
                        spacers[idx] > 0 && (
                          <div style={{ height: spacers[idx] }} />
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
