"use client";

import { useMemo, useEffect, useState } from "react";
import { Song } from "../../types/song";
import Link from "next/link";
import { Button } from "@mantine/core";
import useSearch from "../../hook/useSearch";
import { HiSearch } from "react-icons/hi";
import { FaPlay } from "react-icons/fa6";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";

type Props = {
  initialSongs: Song[];
  year?: number | string;
  displayYearServer?: number | null;
};

export default function YearSummaryClient({
  initialSongs,
  year,
  displayYearServer,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [videoViewMode, setVideoViewMode] = useState<"grid" | "list">("list");

  const yearNumber = Number(year);
  const hasYear = Number.isFinite(yearNumber);

  // 繝槭え繝ｳ繝域凾縺ｫ荳蠎ｦ縺縺大ｮ溯｡・  useEffect(() => {
    setMounted(true);
    // 繝悶Λ繧ｦ繧ｶ蛛ｴ縺ｮ繧ｰ繝ｭ繝ｼ繝舌Ν螟画焚縺ｫ菫晏ｭ倥＆繧後◆繝｢繝ｼ繝峨′縺ゅｌ縺ｰ蠕ｩ蜈・    if (
      typeof window !== "undefined" &&
      typeof (window as any).__YEAR_VIEW_MODE === "string"
    ) {
      setVideoViewMode((window as any).__YEAR_VIEW_MODE);
    }
  }, []);

  const parseYearFromPathname = (): number | null => {
    if (typeof window === "undefined") return null;
    const pathname = window.location.pathname || "";

    const m = pathname.match(/\/summary\/(\d{4})(?:\/|$)/);
    if (m) {
      const y = Number(m[1]);
      return Number.isFinite(y) ? y : null;
    }

    const digits = pathname.match(/(\d{4})/);
    if (digits) {
      const y = Number(digits[1]);
      return Number.isFinite(y) ? y : null;
    }

    return null;
  };

  const [fetchedInitialSongs, setFetchedInitialSongs] = useState<Song[] | null>(
    null,
  );

  const allSongsForYear = useMemo(() => {
    return fetchedInitialSongs ?? initialSongs;
  }, [fetchedInitialSongs, initialSongs]);
  const {
    songs: songsFiltered,
    searchTerm,
    setSearchTerm,
  } = useSearch(allSongsForYear);

  const top10 = useMemo(() => {
    const counts: Record<string, { count: number; example?: Song }> = {};
    songsFiltered.forEach((s) => {
      const key = s.title;
      if (!counts[key]) counts[key] = { count: 0, example: s };
      counts[key].count += 1;
      const currentExample = counts[key].example;
      if (
        currentExample &&
        new Date(s.broadcast_at).getTime() <
          new Date(currentExample.broadcast_at).getTime()
      ) {
        counts[key].example = s;
      }
    });

    const entries = Object.entries(counts).map(
      ([title, { count, example }]) => ({
        title,
        count,
        artist: example?.artist ?? "",
        video_id: example?.video_id ?? "",
        start: example?.start ?? "",
      }),
    );

    entries.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
    if (entries.length === 0) return [];

    const cutoffIndex = Math.min(9, entries.length - 1);
    const cutoffCount = entries[cutoffIndex].count;
    return entries.filter((e) => e.count >= cutoffCount).slice(0, 15);
  }, [songsFiltered]);

  const topArtists = useMemo(() => {
    const counts: Record<string, { count: number; example?: Song }> = {};
    songsFiltered.forEach((s) => {
      const artists = (s.artist || "")
        .split("縲・)
        .map((a) => a.trim())
        .filter(Boolean);
      artists.forEach((artist) => {
        if (!counts[artist]) counts[artist] = { count: 0, example: s };
        counts[artist].count += 1;
        const currentExample = counts[artist].example;
        if (
          currentExample &&
          new Date(s.broadcast_at).getTime() <
            new Date(currentExample.broadcast_at).getTime()
        ) {
          counts[artist].example = s;
        }
      });
    });

    const entries = Object.entries(counts).map(
      ([artist, { count, example }]) => ({
        artist,
        count,
        example,
      }),
    );

    entries.sort(
      (a, b) => b.count - a.count || a.artist.localeCompare(b.artist),
    );
    if (entries.length === 0) return [];

    const cutoffIndex = Math.min(9, entries.length - 1);
    const cutoffCount = entries[cutoffIndex].count;
    return entries.filter((e) => e.count >= cutoffCount).slice(0, 15);
  }, [songsFiltered]);

  const [clientYear, setClientYear] = useState<number | null>(() => {
    if (hasYear) return yearNumber;
    return null;
  });

  useEffect(() => {
    if (clientYear !== null) return;
    const parsed = parseYearFromPathname();
    if (parsed !== null) setClientYear(parsed);
  }, [clientYear]);

  const inferredYearFromSongs = initialSongs[0]?.year ?? null;
  const isYearValid =
    hasYear || clientYear !== null || inferredYearFromSongs !== null;

  const displayYear = isYearValid
    ? hasYear
      ? yearNumber
      : (clientYear ?? inferredYearFromSongs ?? "荳肴・")
    : "荳肴・";

  useEffect(() => {
    if (Number.isFinite(year)) return;
    if (clientYear === null) return;
    if (
      fetchedInitialSongs !== null ||
      (initialSongs && initialSongs.length > 0)
    ) {
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/songs", { cache: "no-store" });
        if (!res.ok) return;
        const allSongs = (await res.json()) as Song[];
        const songsForYear = allSongs.filter((s) => s.year === clientYear);
        setFetchedInitialSongs(songsForYear);
      } catch (e) {
        // ignore
      }
    })();
  }, [year, clientYear, fetchedInitialSongs, initialSongs]);

  const monthsWithSongs = useMemo(() => {
    const src = songsFiltered || [];
    const groups: Record<number, Song[]> = {};
    for (let m = 1; m <= 12; m++) groups[m] = [];
    src
      .sort(
        (a, b) =>
          new Date(a.broadcast_at).getTime() -
          new Date(b.broadcast_at).getTime(),
      )
      .forEach((s) => {
        const date = new Date(s.broadcast_at);
        if (isNaN(date.getTime())) return;
        const m = date.getMonth() + 1;
        groups[m].push(s);
      });
    return Object.entries(groups)
      .map(([k, v]) => [Number(k), v] as const)
      .filter(([, v]) => v.length > 0)
      .sort((a, b) => a[0] - b[0]);
  }, [songsFiltered]);

  // 繧ｳ繝ｩ繝懈峇荳隕ｧ
  const collaborativeSongs = useMemo(() => {
    return (songsFiltered || [])
      .filter((s) => {
        const singers = s.sing.split("縲・).map((x) => x.trim());
        return singers.length >= 2;
      })
      .sort((a, b) => {
        return (
          new Date(a.broadcast_at).getTime() -
          new Date(b.broadcast_at).getTime()
        );
      });
  }, [songsFiltered]);

  // 繧ｳ繝ｩ繝懊＠縺溷屓謨ｰ縺悟､壹＞繝帙Ο繝｡繝ｳ
  const collabCountsBySinger = useMemo(() => {
    const counts: Record<string, number> = {};
    (collaborativeSongs || []).forEach((s) => {
      const singers = s.sing.split("縲・).map((x) => x.trim());
      singers.forEach((singer) => {
        counts[singer] = (counts[singer] || 0) + 1;
      });
    });
    return (
      Object.entries(counts)
        // AZKi譛ｬ莠ｺ縺ｯ髯､螟悶☆繧・        .filter(([singer]) => singer !== "AZKi")
        .map(([singer, count]) => ({ singer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );
  }, [collaborativeSongs]);

  // 繝槭う繝ｫ繧ｹ繝医・繝ｳ縺ｨ驕疲・譌･(broadcast_at)繧貞叙蠕・  const milestonesByYear = useMemo(
    () =>
      songsFiltered
        .sort(
          (a, b) =>
            new Date(a.broadcast_at).getTime() -
            new Date(b.broadcast_at).getTime(),
        )
        .reduce<
          Record<number, { broadcast_at: string; milestones: string[] }[]>
        >((acc, s) => {
          const year = Number(s.year);
          if (Number.isNaN(year)) return acc;
          if (!acc[year]) acc[year] = [];
          // 遨ｺ縺ｮ繝槭う繝ｫ繧ｹ繝医・繝ｳ縺ｯ髯､螟・          if (!s.milestones || s.milestones.length === 0) return acc;
          // 驥崎､・☆繧九・繧､繝ｫ繧ｹ繝医・繝ｳ縺ｯ繧ｹ繧ｭ繝・・
          const existingMilestones =
            acc[year]?.map((m) => m.milestones)?.flat() || [];
          if (existingMilestones.includes(s.milestones[0])) return acc;

          acc[year].push({
            broadcast_at: s.broadcast_at,
            milestones: s.milestones,
          });
          return acc;
        }, {}),
    [songsFiltered],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            蜿朱鹸讌ｽ譖ｲ
          </div>
          <div className="text-2xl font-bold">
            <a href={`/?q=year:${displayYear}`}>
              {(fetchedInitialSongs ?? initialSongs).length}
            </a>
          </div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            豁梧棧縺ｧ豁後▲縺滓峇謨ｰ
          </div>
          <div className="text-2xl font-bold">
            <a href={`/?q=year:${displayYear}|tag:豁梧棧`}>
              {
                (fetchedInitialSongs ?? initialSongs).filter((s) =>
                  s.tags.includes("豁梧棧"),
                ).length
              }
            </a>
          </div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            繧ｲ繧ｹ繝医〒豁後▲縺滓峇謨ｰ
          </div>
          <div className="text-2xl font-bold">
            <a href={`/?q=year:${displayYear}|tag:繧ｲ繧ｹ繝亥・貍覗}>
              {
                (fetchedInitialSongs ?? initialSongs).filter((s) =>
                  s.tags.includes("繧ｲ繧ｹ繝亥・貍・),
                ).length
              }
            </a>
          </div>
        </div>

        <div className="border rounded p-4">
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            繧ｪ繝ｪ繧ｸ繝翫Ν讌ｽ譖ｲ
          </div>
          <div className="text-2xl font-bold">
            <a href={`/?q=year:${displayYear}|tag:繧ｪ繝ｪ譖ｲ`}>
              {
                new Set(
                  (fetchedInitialSongs ?? initialSongs)
                    .filter(
                      (s) =>
                        s.tags.includes("繧ｪ繝ｪ譖ｲ") ||
                        s.tags.includes("繧ｪ繝ｪ譖ｲMV"),
                    )
                    .map((s) => s.title),
                ).size
              }
            </a>
          </div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            繧ｫ繝舌・讌ｽ譖ｲ
          </div>
          <div className="text-2xl font-bold">
            <a href={`/?q=year:${displayYear}|tag:繧ｫ繝舌・譖ｲ`}>
              {
                (fetchedInitialSongs ?? initialSongs).filter((s) =>
                  s.tags.includes("繧ｫ繝舌・譖ｲ"),
                ).length
              }
            </a>
          </div>
        </div>
      </div>

      {displayYear && milestonesByYear[Number(displayYear)] ? (
        <section>
          <h2 className="text-xl font-semibold mb-4">繝槭う繝ｫ繧ｹ繝医・繝ｳ</h2>
          <ul className="space-y-2 list-disc ml-6">
            {milestonesByYear[Number(displayYear)].map((milestone, index) => (
              <li key={index}>
                <div className="font-medium">
                  {milestone.milestones.join(", ")}
                  <span className="text-sm text-gray-700 dark:text-light-gray-400">
                    &nbsp;-&nbsp;
                    {new Date(milestone.broadcast_at).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">豁梧棧縺ｧ繧医￥豁後▲縺滓･ｽ譖ｲ</h2>
          {top10.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              繝・・繧ｿ縺後≠繧翫∪縺帙ｓ縲・            </p>
          ) : (
            <ol className="list-decimal pl-5">
              {(() => {
                const maxCount = Math.max(...top10.map((t) => t.count), 1);
                return top10.map((t) => {
                  const query: Record<string, string> = {};
                  if (t.video_id) query.v = t.video_id;
                  if (t.start) query.t = `${t.start}s`;
                  if (isYearValid) query.q = `year:${displayYear}`;
                  const pct = Math.round((t.count / maxCount) * 100);

                  return (
                    <li key={`${t.title}-${t.artist}`} className="mb-2">
                      <div className="relative rounded overflow-hidden">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-between px-2 py-1">
                          <a
                            href={
                              query.v
                                ? `/?${new URLSearchParams(query).toString()}`
                                : "#"
                            }
                            className="block hover:underline"
                          >
                            <div className="font-medium">
                              {t.title}
                              <span className="text-sm text-gray-700 dark:text-light-gray-400">
                                &nbsp;-&nbsp;{t.artist}
                              </span>
                            </div>
                          </a>
                          <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400">
                            {t.count}蝗・                          </div>
                        </div>
                      </div>
                    </li>
                  );
                });
              })()}
            </ol>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            豁梧棧縺ｧ繧医￥豁後▲縺溘い繝ｼ繝・ぅ繧ｹ繝・          </h2>
          {topArtists.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              繝・・繧ｿ縺後≠繧翫∪縺帙ｓ縲・            </p>
          ) : (
            <ol className="list-decimal pl-5">
              {(() => {
                const maxCount = Math.max(...topArtists.map((a) => a.count), 1);
                return topArtists.map((a) => {
                  const query: Record<string, string> = {};
                  query.q = isYearValid
                    ? `artist:${a.artist}|year:${displayYear}`
                    : `artist:${a.artist}`;
                  const pct = Math.round((a.count / maxCount) * 100);
                  return (
                    <li key={`artist-${a.artist}`} className="mb-2">
                      <div className="relative rounded overflow-hidden">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-green-400 to-emerald-600 dark:from-green-500 dark:to-emerald-400 opacity-30"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-between px-2 py-1">
                          <div className="font-medium">
                            <a
                              href={`/?${new URLSearchParams(
                                query,
                              ).toString()}`}
                              className="block hover:underline"
                            >
                              {a.artist}
                            </a>
                          </div>
                          <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400">
                            {a.count}蝗・                          </div>
                        </div>
                      </div>
                    </li>
                  );
                });
              })()}
            </ol>
          )}
        </section>

        {/*縲繧ｳ繝ｩ繝懷屓謨ｰ縺悟､壹°縺｣縺溘・繝ｭ繝｡繝ｳ */}
        <section>
          <h2 className="text-lg font-semibold mb-2">
            豁後〒繧医￥繧ｳ繝ｩ繝懊＠縺溘・繝ｭ繝｡繝ｳ繝ｻ繧｢繝ｼ繝・ぅ繧ｹ繝・          </h2>
          {collabCountsBySinger.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              繝・・繧ｿ縺後≠繧翫∪縺帙ｓ縲・            </p>
          ) : (
            <ol className="list-decimal pl-5">
              {(() => {
                const maxCount = Math.max(
                  ...collabCountsBySinger.map((a) => a.count),
                  1,
                );
                return collabCountsBySinger.map((a) => {
                  const query: Record<string, string> = {};
                  query.q = isYearValid
                    ? `sing:${a.singer}|year:${displayYear}`
                    : `sing:${a.singer}`;
                  const pct = Math.round((a.count / maxCount) * 100);
                  return (
                    <li key={`singer-${a.singer}`} className="mb-2">
                      <div className="relative rounded overflow-hidden">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-400 to-pink-600 dark:from-purple-500 dark:to-pink-400 opacity-30"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-between px-2 py-1">
                          <div className="font-medium">
                            <a
                              href={`/?${new URLSearchParams(
                                query,
                              ).toString()}`}
                              className="block hover:underline"
                            >
                              {a.singer}
                            </a>
                          </div>
                          <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400">
                            {a.count}譖ｲ
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                });
              })()}
            </ol>
          )}
        </section>

        {/* 譛亥挨譖ｲ謨ｰ */}
        <section>
          <h2 className="text-lg font-semibold mb-2">譛亥挨縺ｮ豁悟罰譖ｲ謨ｰ</h2>
          {monthsWithSongs.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              繝・・繧ｿ縺後≠繧翫∪縺帙ｓ縲・            </p>
          ) : (
            <ul>
              {monthsWithSongs.map(([month, songs]) => (
                <li key={`month-${month}`} className="mb-2">
                  <div className="relative rounded overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-yellow-400 to-red-600 dark:from-yellow-500 dark:to-red-400 opacity-30"
                      style={{
                        width: `${
                          Math.max(
                            ...monthsWithSongs.map(
                              ([_, songs]) => songs.length,
                            ),
                          ) !== 0
                            ? (songs.length /
                                Math.max(
                                  ...monthsWithSongs.map(
                                    ([_, songs]) => songs.length,
                                  ),
                                )) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                    <div className="relative z-10 flex items-center justify-between px-2 py-1">
                      <div className="font-medium">{month}譛・/div>
                      <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400">
                        {songs.length}譖ｲ
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-2">
          繧ｪ繝ｪ譖ｲ繝ｻ繧ｫ繝舌・譖ｲMV (
          {
            songsFiltered.filter((s) =>
              (s.tags || []).some(
                (t) => t === "繧ｪ繝ｪ譖ｲ" || t === "繧ｪ繝ｪ譖ｲMV" || t === "繧ｫ繝舌・譖ｲ",
              ),
            ).length
          }
          )
          <a
            href={`/?q=year:${displayYear}|tag:繧ｪ繝ｪ譖ｲ`}
            className="ml-4 text-sm text-blue-600 hover:underline"
          >
            <FaPlay className="inline-block mr-1" />
            繧ｪ繝ｪ譖ｲ
          </a>
          <a
            href={`/?q=year:${displayYear}|tag:繧ｫ繝舌・譖ｲ`}
            className="ml-4 text-sm text-blue-600 hover:underline"
          >
            <FaPlay className="inline-block mr-1" />
            繧ｫ繝舌・譖ｲ
          </a>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {(songsFiltered || [])
            .filter((s) =>
              (s.tags || []).some(
                (t) => t === "繧ｪ繝ｪ譖ｲ" || t === "繧ｪ繝ｪ譖ｲMV" || t === "繧ｫ繝舌・譖ｲ",
              ),
            )
            .sort(
              (a, b) =>
                new Date(a.broadcast_at).getTime() -
                new Date(b.broadcast_at).getTime(),
            )
            .map((g, i) => (
              <article
                key={`${g.video_id || i}-special-${i}`}
                className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <Link
                  href={`/?v=${g.video_id || ""}${
                    g.start ? `&t=${g.start}s` : ""
                  }&q=year:${displayYear}`}
                  className="block"
                >
                  <div className="w-full aspect-video bg-black">
                    <YoutubeThumbnail
                      videoId={g.video_id}
                      alt={g.title}
                      fill={true}
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-medium line-clamp-2">{g.title}</div>
                    {g.artist && (
                      <div className="text-sm text-gray-700 dark:text-light-gray-400">
                        {g.artist}
                      </div>
                    )}
                    <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
                      {new Date(g.broadcast_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
        </div>
      </section>

      {/* 2莠ｺ莉･荳翫〒豁悟罰縺励◆豁梧棧 */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-2">
          繧ｳ繝ｩ繝懊・繝・Η繧ｨ繝・ヨ繝ｻ繧ｲ繧ｹ繝亥盾蜉 ({(collaborativeSongs || []).length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {(collaborativeSongs || []).map((s) => (
            <article
              key={`${s.video_id || ""}-collab-${s.start || ""}`}
              className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <Link
                href={`/?v=${s.video_id || ""}${
                  s.start ? `&t=${s.start}s` : ""
                }&q=year:${displayYear}`}
              >
                <div className="w-full aspect-video bg-black">
                  <YoutubeThumbnail
                    videoId={s.video_id}
                    alt={s.title}
                    fill={true}
                  />
                </div>
                <div className="p-3">
                  <div className="font-medium line-clamp-2">{s.title}</div>
                  <div className="text-sm text-gray-700 dark:text-light-gray-400">
                    {s.artist}
                  </div>
                  <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1 line-clamp-1">
                    {s.sing}
                  </div>
                  <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
                    {new Date(s.broadcast_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{displayYear}蟷ｴ縺ｮ蜍慕判</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVideoViewMode("grid")}
              className={`px-2 py-1 rounded text-sm ${
                mounted && videoViewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              繧ｿ繧､繝ｫ
            </button>
            <button
              type="button"
              onClick={() => setVideoViewMode("list")}
              className={`px-2 py-1 rounded text-sm ${
                mounted && videoViewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              繝ｪ繧ｹ繝・            </button>
          </div>
        </div>

        <div className="mb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearchTerm(e.currentTarget.search.value);
            }}
          >
            <div className="flex items-center">
              <input
                type="search"
                name="search"
                placeholder="Search..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
              <Button type="submit" className="ml-2">
                <HiSearch className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>

        {monthsWithSongs.length === 0 ? (
          <p className="text-sm text-gray-700 dark:text-light-gray-400">
            隧ｲ蠖薙☆繧句虚逕ｻ縺ｯ縺ゅｊ縺ｾ縺帙ｓ縲・          </p>
        ) : (
          <div className="space-y-6">
            {monthsWithSongs.map(([month, monthSongs]) => (
              <div key={month}>
                <h3 className="text-md font-semibold mb-2 bg-primary-200 dark:bg-primary-900 p-2 ">
                  {month}譛・({monthSongs.length})
                </h3>
                {mounted && videoViewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {monthSongs.map((g, i) => (
                      <article
                        key={`${g.video_id || i}-${i}`}
                        className="bg-white dark:bg-gray-800 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        <Link
                          href={`/?v=${g.video_id || ""}${
                            g.start ? `&t=${g.start}s` : ""
                          }&q=year:${displayYear}`}
                          className="block"
                        >
                          <div className="w-full aspect-video bg-black">
                            <YoutubeThumbnail
                              videoId={g.video_id}
                              alt={g.title}
                              fill={true}
                            />
                          </div>
                          <div className="p-3">
                            <div className="font-medium line-clamp-2">
                              {g.title}
                            </div>
                            {g.artist && (
                              <div className="text-sm text-gray-700 dark:text-light-gray-400">
                                {g.artist}
                              </div>
                            )}
                            <div className="text-xs text-gray-700 dark:text-light-gray-400 mt-1">
                              {new Date(g.broadcast_at).toLocaleDateString()}
                            </div>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const byVideo: Record<string, any> = {};
                      monthSongs.forEach((s) => {
                        const id = s.video_id || `noid-${s.broadcast_at}`;
                        if (!byVideo[id])
                          byVideo[id] = {
                            title: s.video_title || "(荳肴・)",
                            id,
                            uri: s.video_uri || "",
                            broadcast_at: new Date(s.broadcast_at),
                            songs: [],
                          };
                        byVideo[id].songs.push(s);
                      });
                      return Object.values(byVideo).map((v: any) => (
                        <div
                          key={`v-${v.id}`}
                          className="border rounded p-2 bg-white dark:bg-gray-800"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {v.id && !v.id.startsWith("noid-") && (
                                <a
                                  href={
                                    v.uri ||
                                    `https://www.youtube.com/watch?v=${v.id}`
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block shrink-0 w-32 h-18 bg-black relative"
                                >
                                  <YoutubeThumbnail
                                    videoId={v.id}
                                    alt={v.title}
                                    fill={true}
                                  />
                                </a>
                              )}
                              <a
                                href={
                                  v.uri ||
                                  `https://www.youtube.com/watch?v=${v.id}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium hover:underline"
                              >
                                {v.title}
                                <span className="text-sm text-gray-700 dark:text-light-gray-400">
                                  <br />
                                  {v.broadcast_at.toLocaleDateString()}
                                </span>
                              </a>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-light-gray-400">
                              {v.songs.length}譖ｲ
                            </div>
                          </div>
                          <ul className="mt-2 ml-3 pl-4 list-disc">
                            {v.songs.map((s: Song, idx: number) => (
                              <li key={`${v.id}-${idx}`} className="text-sm">
                                <a
                                  href={`/?v=${v.id}${
                                    s.start ? `&t=${s.start}s` : ""
                                  }&q=year:${displayYear}`}
                                  className="hover:underline"
                                >
                                  {s.title}
                                  {s.artist && (
                                    <span className="text-xs text-gray-500 dark:text-gray-300">
                                      {" "}
                                      - {s.artist}
                                    </span>
                                  )}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6">
        <Link href="/summary" className="text-sm underline">
          竊・蟷ｴ縺斐→縺ｮ縺ｾ縺ｨ繧√↓謌ｻ繧・        </Link>
      </div>
    </div>
  );
}
