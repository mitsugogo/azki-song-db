import Link from "next/link";
import type { Metadata } from "next";
import { metadata } from "../layout";
import { Breadcrumbs, Tooltip } from "@mantine/core";
import { FaHome } from "react-icons/fa";
import { ROUTE_RANGES } from "../config/timelineRoutes";
import { VISUAL_CHANGES } from "../config/timelineVisuals";

const baseUrl =
  process.env.PUBLIC_BASE_URL ?? "https://azki-song-db.vercel.app/";

export async function generateMetadata(): Promise<Metadata> {
  const title = "年ごとの活動記録";
  const subtitle =
    "年ごとの活動（収録楽曲数・カバー/オリ曲など）をまとめています";

  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);
  ogImageUrl.searchParams.set("subtitle", subtitle);
  ogImageUrl.searchParams.set("w", "1200");
  ogImageUrl.searchParams.set("h", "630");

  return {
    ...metadata,
    title: `${title} | AZKi Song Database`,
    description: subtitle,
    openGraph: {
      ...metadata.openGraph,
      images: [ogImageUrl.toString()],
    },
  };
}

export default async function Page() {
  const res = await fetch(`${baseUrl}/api/songs`, { cache: "no-store" });
  const songs = (await res.json()) as any[];

  const counts = songs.reduce<Record<number, number>>((acc, s) => {
    const y = Number(s.year);
    if (!Number.isNaN(y)) acc[y] = (acc[y] || 0) + 1;
    return acc;
  }, {});

  const years = Object.keys(counts)
    .map((k) => Number(k))
    .sort((a, b) => b - a);

  const activityStart = new Date(2018, 10, 15);
  const now = new Date();
  const activityDays =
    Math.floor(
      (now.getTime() - activityStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const breadcrumbItems = [
    {
      title: (
        <span>
          <FaHome className="inline-block mr-1" />
        </span>
      ),
      href: "/",
    },
    { title: "年ごとの活動記録", href: "/summary" },
  ].map((item, index) => (
    <Link
      href={item.href}
      key={index}
      className="text-primary-700 hover:underline dark:text-primary-300"
    >
      {item.title}
    </Link>
  ));

  const milestonesByYear = songs
    .sort(
      (a, b) =>
        new Date(a.broadcast_at).getTime() - new Date(b.broadcast_at).getTime(),
    )
    .reduce<Record<number, { broadcast_at: string; milestones: string[] }[]>>(
      (acc, song) => {
        const year = Number(song.year);
        if (Number.isNaN(year)) return acc;
        if (!acc[year]) acc[year] = [];
        if (!song.milestones || song.milestones.length === 0) return acc;
        if (
          acc[year].some((entry) =>
            entry.milestones.includes(song.milestones[0]),
          )
        )
          return acc;
        acc[year].push({
          broadcast_at: song.broadcast_at,
          milestones: song.milestones || [],
        });
        return acc;
      },
      {},
    );

  const msPerDay = 1000 * 60 * 60 * 24;

  const allMilestones = songs
    .filter((s) => s.milestones && s.milestones.length > 0 && s.broadcast_at)
    .flatMap((s) =>
      (s.milestones || []).map((m: string) => ({
        date: new Date(s.broadcast_at),
        text: m,
      })),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const debutDateIso = new Date(2018, 10, 15).toISOString();
  if (
    !allMilestones.some(
      (m) => m.date.toISOString() === debutDateIso && m.text === "デビュー",
    )
  ) {
    allMilestones.push({ date: new Date(2018, 10, 15), text: "デビュー" });
    allMilestones.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  const uniqueMilestones = (() => {
    const map = new Map<string, Date>();
    for (const m of allMilestones) {
      const prev = map.get(m.text);
      if (!prev || m.date.getTime() < prev.getTime()) map.set(m.text, m.date);
    }
    return Array.from(map.entries())
      .map(([text, date]) => ({ text, date }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  })();

  const getRouteLabel = (d: Date) => {
    const y20181115 = new Date(2018, 10, 15).setHours(0, 0, 0, 0);
    const y20210410 = new Date(2021, 3, 10).setHours(23, 59, 59, 999);
    const y20210411 = new Date(2021, 3, 11).setHours(0, 0, 0, 0);
    const y20230630 = new Date(2023, 5, 30).setHours(23, 59, 59, 999);
    const y20230701 = new Date(2023, 6, 1).setHours(0, 0, 0, 0);
    const t = d.getTime();
    if (t >= y20181115 && t <= y20210410) return "ルートα";
    if (t >= y20210411 && t <= y20230630) return "ルートβ";
    if (t >= y20230701) return "ルートγ";
    return "";
  };

  const yearNodes = years.flatMap((year) => {
    const node = (
      <li
        key={year}
        className="border rounded p-3 hover:shadow-md transition-shadow duration-150 dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-gray-600"
      >
        <Link href={`/summary/${year}`}>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{year}年</span>
            <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1">
              {counts[year]}曲
            </span>
          </div>
          <div>
            {milestonesByYear[year] && (
              <ul className="mt-2 space-y-1">
                {milestonesByYear[year]
                  .flat()
                  .map(
                    (
                      s: { broadcast_at: string; milestones: string[] },
                      idx: number,
                    ) => (
                      <li
                        key={idx}
                        className="text-sm text-light-gray-600 dark:text-light-gray-400"
                      >
                        • {s.milestones.join(", ")} (
                        {new Date(s.broadcast_at).toLocaleDateString("ja-JP")})
                      </li>
                    ),
                  )}
              </ul>
            )}
          </div>
        </Link>
      </li>
    );

    if (year === 2018) {
      const timelineNode = (
        <li key="timeline" className="col-span-full mt-6 p-3 border-t">
          <h2 className="font-bold text-xl mb-2">年表</h2>
          {(() => {
            // use full activity span: from activityStart to at least now (and ensure covers 2025/12/07)
            const start = activityStart;
            const lastMilestoneTime =
              uniqueMilestones[uniqueMilestones.length - 1]?.date?.getTime() ??
              activityStart.getTime();
            const minEndTime = new Date(2025, 11, 7, 23, 59, 59, 999).getTime();
            const end = new Date(
              Math.max(lastMilestoneTime, Date.now(), minEndTime),
            );
            const totalRange = Math.max(1, end.getTime() - start.getTime());

            // layout constants (px)
            const padding = 12;
            const minGap = 26;
            // add height proportional to total days to avoid compressed segments (0.55px per day)
            const heightByDays = (totalRange / msPerDay) * 0.55;
            const timelineHeight = Math.max(
              800,
              padding * 2 + (uniqueMilestones.length - 1) * minGap + 80,
              heightByDays,
            );

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
            const totalDur = overlaps.reduce((s, x) => s + x.dur, 0) || 1;
            const colors = [
              ["rgba(99,102,241,0.12)", "rgba(99,102,241,0.6)"],
              ["rgba(16,185,129,0.12)", "rgba(16,185,129,0.6)"],
              ["rgba(234,88,12,0.12)", "rgba(234,88,12,0.6)"],
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
              <div className="flex" style={{ height: timelineHeight }}>
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

                    // raw positions in px (from top)
                    const raw = uniqueMilestones.map((m) => {
                      const t =
                        (m.date.getTime() - start.getTime()) / totalRange;
                      return padding + Math.max(0, Math.min(1, t)) * avail;
                    });

                    // enforce minimal gap with forward/backward passes
                    const adj: number[] = raw.slice();
                    // if not enough space for desired gaps, reduce minGap proportionally
                    const n = adj.length;
                    let effectiveMinGap = minGap;
                    const required = (n - 1) * effectiveMinGap;
                    if (required > avail && n > 1) {
                      effectiveMinGap = Math.max(6, Math.floor(avail / n));
                    }

                    // iterate forward/backward to settle positions
                    for (let iter = 0; iter < 3; iter++) {
                      // forward
                      for (let i = 1; i < n; i++) {
                        if (adj[i] < adj[i - 1] + effectiveMinGap) {
                          adj[i] = adj[i - 1] + effectiveMinGap;
                        }
                      }
                      // backward
                      for (let i = n - 2; i >= 0; i--) {
                        if (adj[i] > adj[i + 1] - effectiveMinGap) {
                          adj[i] = adj[i + 1] - effectiveMinGap;
                        }
                      }
                    }

                    // clamp into available range, shifting if overflow
                    const topLimit = padding;
                    const bottomLimit = padding + avail;
                    // compute overflow at bottom
                    const overflow = Math.max(0, adj[n - 1] - bottomLimit);
                    if (overflow > 0) {
                      for (let i = 0; i < n; i++) adj[i] = adj[i] - overflow;
                    }
                    // ensure top not above padding
                    if (adj[0] < topLimit) {
                      const under = topLimit - adj[0];
                      for (let i = 0; i < n; i++) adj[i] = adj[i] + under;
                    }

                    return uniqueMilestones.map((m, idx) => {
                      const daysSince =
                        Math.floor(
                          (m.date.getTime() - activityStart.getTime()) /
                            msPerDay,
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
                            {m.date.toLocaleDateString("ja-JP")} — {m.text}
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
        </li>
      );
      return [node, timelineNode];
    }

    return [node];
  });

  return (
    <div className="flex-grow lg:p-6 lg:pb-0">
      <div className="mb-4">
        <Breadcrumbs separator="›">{breadcrumbItems}</Breadcrumbs>
      </div>
      <h1 className="font-extrabold text-2xl p-3">年ごとの活動記録</h1>

      <div className="p-3">
        <p className="text-sm text-light-gray-400 mb-4">
          各年ごとの活動の要約ページです。年をクリックすると詳細ページへ移動します。
        </p>
        <p className="text-sm text-light-gray-400 mb-4">
          活動日数: <span className="font-semibold">{activityDays}</span>
          日（2018/11/15から）
        </p>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {yearNodes}
        </ul>
      </div>
    </div>
  );
}
