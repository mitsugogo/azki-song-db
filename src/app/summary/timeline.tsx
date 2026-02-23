"use client";

import Link from "next/link";
import { ROUTE_RANGES } from "../config/timelineRoutes";
import { VISUAL_CHANGES } from "../config/timelineVisuals";
import { Song } from "../types/song";
import useMilestones from "../hook/useMilestones";
import { Badge, Text } from "@mantine/core";
import { FaExternalLinkAlt } from "react-icons/fa";

export default function Timeline({ songs }: { songs: Song[] }) {
  const activityStart = new Date(2018, 10, 15);

  const msPerDay = 1000 * 60 * 60 * 24;

  const { items: externalMilestones } = useMilestones();

  const songMilestones = songs
    .filter((s) => s.milestones && s.milestones.length > 0 && s.broadcast_at)
    .flatMap((s) =>
      (s.milestones || []).map((m: string) => ({
        date: new Date(s.broadcast_at),
        text: m,
      })),
    );

  const apiMilestones = (externalMilestones || [])
    .map((m) => ({
      date: m.date ? new Date(m.date) : null,
      text: m.content,
      note: m.note || "",
      url: m.url || "",
      is_external: true, // APIからのマイルストーンかどうか
    }))
    .filter((m) => m.date && m.text) as {
    date: Date;
    text: string;
    note?: string;
    url?: string;
    is_external?: boolean;
  }[];

  const allMilestones = [...songMilestones, ...apiMilestones].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const uniqueMilestones = (() => {
    const map = new Map<
      string,
      { date: Date; note?: string; url?: string; is_external?: boolean }
    >();
    for (const m of allMilestones) {
      const prev = map.get(m.text);
      if (!prev || m.date.getTime() < prev.date.getTime())
        map.set(m.text, {
          date: m.date,
          note: (m as any).note,
          url: (m as any).url,
          is_external: (m as any).is_external,
        });
    }
    return Array.from(map.entries())
      .map(([text, obj]) => ({
        text,
        date: obj.date,
        note: obj.note,
        url: obj.url,
        is_external: obj.is_external || false,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  })();

  return (
    <>
      <div key="timeline" className="col-span-full mt-6 p-3 border-t">
        <h2 className="font-bold text-xl mb-2">活動年表</h2>
        {(() => {
          const start = activityStart;
          const lastMilestoneTime =
            uniqueMilestones[uniqueMilestones.length - 1]?.date?.getTime() ??
            activityStart.getTime();

          const finalMileStoneTime =
            uniqueMilestones[0]?.date?.getTime() ?? Date.now();
          const minEndTime = finalMileStoneTime;
          const end = new Date(
            Math.max(lastMilestoneTime, Date.now(), minEndTime),
          );
          const totalRange = Math.max(1, end.getTime() - start.getTime());

          // レイアウト定数（px）
          const padding = 12;
          const minGap = 26;

          // 総日数に比例して高さを追加し、セグメントの圧縮を避ける（1日あたり0.55px）
          const heightByDays = (totalRange / msPerDay) * 0.55;

          // マイルストーン数に応じて確実に十分な高さを確保する
          // API 由来のマイルストーンが増えた場合でも縦方向の余裕を持たせる
          const heightByItems = padding * 2 + uniqueMilestones.length * 40;

          const timelineHeight = Math.max(800, heightByItems, heightByDays);

          const routeRanges = ROUTE_RANGES.map((r) => {
            const from = new Date(r.from).setHours(0, 0, 0, 0);
            const to = r.to
              ? new Date(r.to).setHours(23, 59, 59, 999)
              : Infinity;
            return { label: r.label, from, to };
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
            return { label: v.label, from, to, color: v.color };
          });

          const visualOverlaps = visualRanges.map((r) => {
            const segStart = Math.max(r.from, start.getTime());
            const segEnd = Math.min(r.to, end.getTime());
            const dur = Math.max(0, segEnd - segStart);
            return { ...r, segStart, segEnd, dur };
          });

          return (
            <div className="flex" style={{ height: timelineHeight + 30 }}>
              <div className="w-12 relative mr-2 h-full">
                {overlaps.map((o, i) => {
                  if (o.dur === 0) return null;
                  const startRatio =
                    (o.segStart - start.getTime()) / totalRange;
                  const endRatio = (o.segEnd - start.getTime()) / totalRange;
                  const topPx = Math.max(0, startRatio * timelineHeight);
                  const heightPx = Math.max(
                    6,
                    (endRatio - startRatio) * timelineHeight,
                  );
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
                        className="rounded-l"
                      />
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "upright",
                        }}
                        className="text-xs text-center text-light-gray-500 dark:text-light-gray-400 z-10"
                      >
                        {o.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="w-12 relative mr-2 h-full">
                {visualOverlaps.map((o, i) => {
                  if (o.dur === 0) return null;
                  const startRatio =
                    (o.segStart - start.getTime()) / totalRange;
                  const endRatio = (o.segEnd - start.getTime()) / totalRange;
                  const topPx = Math.max(0, startRatio * timelineHeight);
                  const heightPx = Math.max(
                    6,
                    (endRatio - startRatio) * timelineHeight,
                  );
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
                        className="rounded-l"
                      />
                      <div
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "upright",
                        }}
                        className="text-xs text-center text-light-gray-500 dark:text-light-gray-400 z-10"
                      >
                        {o.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 relative h-full">
                {(() => {
                  const padding = 12;
                  const minGap = 26; // px
                  const avail = Math.max(100, timelineHeight - padding * 2);

                  // 生の位置（px、上からの距離）
                  const raw = uniqueMilestones.map((m) => {
                    const t = (m.date.getTime() - start.getTime()) / totalRange;
                    return padding + Math.max(0, Math.min(1, t)) * avail;
                  });

                  // 前方/後方パスで最小間隔を維持
                  const adj: number[] = raw.slice();
                  // 希望する間隔用の空間が足りない場合、`minGap` を比例して縮小
                  const n = adj.length;
                  let effectiveMinGap = minGap;
                  const required = (n - 1) * effectiveMinGap;
                  if (required > avail && n > 1) {
                    effectiveMinGap = Math.max(6, Math.floor(avail / n));
                  }

                  // 位置を調整するために前方・後方に繰り返し処理
                  for (let iter = 0; iter < 3; iter++) {
                    // 前方パス
                    for (let i = 1; i < n; i++) {
                      if (adj[i] < adj[i - 1] + effectiveMinGap) {
                        adj[i] = adj[i - 1] + effectiveMinGap;
                      }
                    }
                    // 後方パス
                    for (let i = n - 2; i >= 0; i--) {
                      if (adj[i] > adj[i + 1] - effectiveMinGap) {
                        adj[i] = adj[i + 1] - effectiveMinGap;
                      }
                    }
                  }

                  // 利用可能範囲にクランプし、はみ出す場合はシフト
                  const topLimit = padding;
                  const bottomLimit = padding + avail;
                  // 下側のオーバーフローを計算
                  const overflow = Math.max(0, adj[n - 1] - bottomLimit);
                  if (overflow > 0) {
                    for (let i = 0; i < n; i++) adj[i] = adj[i] - overflow;
                  }
                  // 上端がパディングより上にならないようにする
                  if (adj[0] < topLimit) {
                    const under = topLimit - adj[0];
                    for (let i = 0; i < n; i++) adj[i] = adj[i] + under;
                  }

                  return uniqueMilestones.map((m, idx) => {
                    const daysSince =
                      Math.floor(
                        (m.date.getTime() - activityStart.getTime()) / msPerDay,
                      ) + 1;
                    const topPx = Math.round(adj[idx] ?? padding);
                    return (
                      <div
                        key={idx}
                        style={{
                          position: "absolute",
                          top: `${topPx}px`,
                          left: 0,
                          right: 0,
                          transform: "translateY(-50%)",
                        }}
                        className="flex items-center justify-between text-sm text-light-gray-600 dark:text-light-gray-400 hover:bg-light-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                      >
                        <div className="pl-2">
                          <span className="w-20 inline-block">
                            {m.date.toLocaleDateString("ja-JP")}
                          </span>{" "}
                          —{" "}
                          {m.is_external && (!m.url || m.url.trim() === "") && (
                            <span>{m.text}</span>
                          )}
                          {(!m.is_external ||
                            (m.is_external &&
                              m.url &&
                              m.url.trim() !== "")) && (
                            <Link
                              href={m.url ? m.url : `/?q=milestone:${m.text}`}
                              className="text-primary"
                              target={m.url ? "_blank" : undefined}
                            >
                              {m.text}
                            </Link>
                          )}
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
                        <div className="pr-2 text-right whitespace-nowrap">
                          活動日数:{" "}
                          <span className="font-semibold">{daysSince}</span>日
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
