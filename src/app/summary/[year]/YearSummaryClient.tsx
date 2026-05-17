"use client";

import { useMemo, useEffect, useState, FormEvent } from "react";
import { Song } from "../../types/song";
import { Link } from "@/i18n/navigation";
import {
  Badge,
  Button,
  Input,
  InputClearButton,
  List,
  Text,
} from "@mantine/core";
import useSearch from "../../hook/useSearch";
import { HiSearch } from "react-icons/hi";
import { FaPlay, FaYoutube } from "react-icons/fa6";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import useSongs from "../../hook/useSongs";
import useMilestones from "../../hook/useMilestones";
import { siteConfig } from "@/app/config/siteConfig";
import { isCoverSong, isPossibleOriginalSong } from "@/app/config/filters";
import { useTranslations, useLocale } from "next-intl";
import { formatDate } from "../../lib/formatDate";
import { FaExternalLinkAlt } from "react-icons/fa";
import SummarySongCard from "./SummarySongCard";

type Props = {
  initialSongs: Song[];
  year?: number | string;
  displayYearServer?: number | null;
};

const normalizeExternalMilestoneUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host !== "youtube.com" && host !== "m.youtube.com") {
      return url;
    }

    const videoId = parsedUrl.searchParams.get("v");
    if (!videoId) {
      return url;
    }

    const shortUrl = new URL(`https://youtu.be/${videoId}`);
    const time = parsedUrl.searchParams.get("t");
    if (time) {
      shortUrl.searchParams.set("t", time);
    }

    return shortUrl.toString();
  } catch {
    return url;
  }
};

export default function YearSummaryClient({
  initialSongs,
  year,
  displayYearServer,
}: Props) {
  const t = useTranslations("Summary");
  const locale = useLocale();

  const formatMonthLabel = (m: number) => {
    try {
      const dtf = new Intl.DateTimeFormat(locale || undefined, {
        month: "long",
      });
      return dtf.format(new Date(2020, m - 1, 1));
    } catch (e) {
      return `${m}${t("monthOfYearSuffix")}`;
    }
  };
  const [mounted, setMounted] = useState(false);
  const [videoViewMode, setVideoViewMode] = useState<"grid" | "list">("list");
  const [searchValue, setSearchValue] = useState("");
  const { items: externalMilestones } = useMilestones();

  const buildMilestoneSearchHref = (milestone: string) => {
    return `/?q=${encodeURIComponent(`milestone:${milestone}`)}`;
  };

  const yearNumber = Number(year);
  const hasYear = Number.isFinite(yearNumber);

  // マウント時に一度だけ実行
  useEffect(() => {
    setMounted(true);
    // ブラウザ側のグローバル変数に保存されたモードがあれば復元
    if (
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

  const { allSongs } = useSongs();

  const allSongsForYear = useMemo(() => {
    return fetchedInitialSongs ?? initialSongs;
  }, [fetchedInitialSongs, initialSongs]);
  const {
    songs: songsFiltered,
    searchTerm,
    setSearchTerm,
  } = useSearch(allSongsForYear);

  useEffect(() => {
    setSearchValue(searchTerm ?? "");
  }, [searchTerm]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchTerm(searchValue);
  };

  /**
   * 歌枠かつAZKiさんが歌っているか
   */
  const isSingingStreamAndSingTargetTalent = (song: Song) => {
    return (
      song.sing
        .split("、")
        .map((x) => x.trim())
        .includes(siteConfig.talentName) && song.tags.includes("歌枠")
    );
  };

  const top10 = useMemo(() => {
    const counts: Record<string, { count: number; example?: Song }> = {};
    songsFiltered.forEach((s) => {
      // AZKiさん歌唱の曲のみを対象とする
      if (!isSingingStreamAndSingTargetTalent(s)) {
        return;
      }

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
      // AZKiさん歌唱の曲のみを対象とする
      if (!isSingingStreamAndSingTargetTalent(s)) {
        return;
      }
      const artists = (s.artist || "")
        .split("、")
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
      : (clientYear ?? inferredYearFromSongs ?? t("unknown"))
    : t("unknown");

  useEffect(() => {
    if (Number.isFinite(year)) return;
    if (clientYear === null) return;
    if (
      fetchedInitialSongs !== null ||
      (initialSongs && initialSongs.length > 0)
    ) {
      return;
    }

    if (Array.isArray(allSongs) && allSongs.length > 0) {
      const songsForYear = allSongs.filter((s) => s.year === clientYear);
      setFetchedInitialSongs(songsForYear);
    }
  }, [year, clientYear, fetchedInitialSongs, initialSongs, allSongs]);

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

  // コラボ曲一覧
  const collaborativeSongs = useMemo(() => {
    return (songsFiltered || [])
      .filter((s) => {
        const singers = s.sings.map((x) => x.trim());
        return singers.length >= 2 && singers.includes(siteConfig.talentName);
      })
      .sort((a, b) => {
        return (
          new Date(a.broadcast_at).getTime() -
          new Date(b.broadcast_at).getTime()
        );
      });
  }, [songsFiltered]);

  // コラボした回数が多いホロメン
  const collabCountsBySinger = useMemo(() => {
    const counts: Record<string, number> = {};
    (collaborativeSongs || []).forEach((s) => {
      const singers = s.sings.map((x) => x.trim());
      singers.forEach((singer) => {
        counts[singer] = (counts[singer] || 0) + 1;
      });
    });
    return (
      Object.entries(counts)
        // AZKi本人は除外する
        .filter(([singer]) => singer !== siteConfig.talentName)
        .map(([singer, count]) => ({ singer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    );
  }, [collaborativeSongs]);

  // マイルストーンと達成日(broadcast_at)を取得（songs + /api/milestones）
  const milestonesByYear = useMemo(() => {
    type YearMilestone = {
      broadcast_at: string;
      milestone: string;
      note?: string;
      is_external: boolean;
      url: string;
    };

    const milestones = new Map<number, Map<string, YearMilestone>>();

    const getOrCreateYearMap = (year: number) => {
      const current = milestones.get(year);
      if (current) return current;
      const next = new Map<string, YearMilestone>();
      milestones.set(year, next);
      return next;
    };

    const mergeMilestone = (
      targetYear: number,
      milestoneText: string,
      candidate: YearMilestone,
    ) => {
      const yearMap = getOrCreateYearMap(targetYear);
      const existing = yearMap.get(milestoneText);
      if (!existing) {
        yearMap.set(milestoneText, candidate);
        return;
      }

      const existingTime = new Date(existing.broadcast_at).getTime();
      const candidateTime = new Date(candidate.broadcast_at).getTime();
      const shouldUseCandidateDate =
        Number.isFinite(candidateTime) &&
        (!Number.isFinite(existingTime) || candidateTime < existingTime);

      yearMap.set(milestoneText, {
        ...existing,
        broadcast_at: shouldUseCandidateDate
          ? candidate.broadcast_at
          : existing.broadcast_at,
        is_external: existing.is_external || candidate.is_external,
        url: existing.url || candidate.url,
        note: existing.note || candidate.note,
      });
    };

    [...songsFiltered]
      .sort(
        (a, b) =>
          new Date(a.broadcast_at).getTime() -
          new Date(b.broadcast_at).getTime(),
      )
      .forEach((s) => {
        const year = Number(s.year);
        if (Number.isNaN(year)) return;

        (s.milestones || [])
          .map((milestone) => milestone.trim())
          .filter(Boolean)
          .forEach((milestone) => {
            mergeMilestone(year, milestone, {
              broadcast_at: s.broadcast_at,
              milestone,
              is_external: false,
              url: "",
            });
          });
      });

    (externalMilestones || []).forEach((m) => {
      const milestone = (m.content || "").trim();
      if (!milestone || !m.date) return;

      const parsedDate = new Date(m.date);
      if (Number.isNaN(parsedDate.getTime())) return;

      const year = parsedDate.getUTCFullYear();
      mergeMilestone(year, milestone, {
        broadcast_at: parsedDate.toISOString(),
        milestone,
        is_external: true,
        url: m.url || "",
        note: m.note || "",
      });
    });

    const result: Record<number, YearMilestone[]> = {};
    for (const [year, items] of milestones.entries()) {
      result[year] = Array.from(items.values()).sort(
        (a, b) =>
          new Date(a.broadcast_at).getTime() -
          new Date(b.broadcast_at).getTime(),
      );
    }

    return result;
  }, [songsFiltered, externalMilestones]);

  const displayYearMilestones = milestonesByYear[Number(displayYear)] || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href={`/?q=year:${displayYear}`}
          className="border rounded p-4 card-glassmorphism hover-lift-shadow"
        >
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            {t("yearCards.recordedSongsLabel")}
          </div>
          <div className="text-2xl font-bold">
            {(fetchedInitialSongs ?? initialSongs).length}
          </div>
        </Link>
        <Link
          href={`/?q=year:${displayYear}|tag:歌枠`}
          className="border rounded p-4 card-glassmorphism hover-lift-shadow"
        >
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            {t("yearCards.sungInStreamsLabel")}
          </div>
          <div className="text-2xl font-bold">
            {
              (fetchedInitialSongs ?? initialSongs).filter((s) =>
                s.tags.includes("歌枠"),
              ).length
            }
          </div>
        </Link>
        <Link
          href={`/?q=year:${displayYear}|tag:ゲスト出演`}
          className="border rounded p-4 card-glassmorphism hover-lift-shadow"
        >
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            {t("yearCards.guestSongsLabel")}
          </div>
          <div className="text-2xl font-bold">
            {
              (fetchedInitialSongs ?? initialSongs).filter((s) =>
                s.tags.includes("ゲスト出演"),
              ).length
            }
          </div>
        </Link>

        <Link
          href={`/?q=year:${displayYear}|original-songs`}
          className="border rounded p-4 card-glassmorphism hover-lift-shadow"
        >
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            {t("yearCards.originalSongsLabel")}
          </div>
          <div className="text-2xl font-bold">
            {
              new Set(
                (fetchedInitialSongs ?? initialSongs)
                  .filter((s) => isPossibleOriginalSong(s))
                  .map((s) => s.title),
              ).size
            }
          </div>
        </Link>
        <Link
          href={`/?q=year:${displayYear}|tag:カバー曲`}
          className="border rounded p-4 card-glassmorphism hover-lift-shadow"
        >
          <div className="text-sm text-gray-700 dark:text-light-gray-400">
            {t("yearCards.coversLabel")}
          </div>
          <div className="text-2xl font-bold">
            {
              (fetchedInitialSongs ?? initialSongs).filter((s) =>
                isCoverSong(s),
              ).length
            }
          </div>
        </Link>
      </div>

      {displayYear && displayYearMilestones.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold mb-4">{t("milestonesTitle")}</h2>
          <ul className="space-y-2 list-disc ml-6">
            {displayYearMilestones.map((milestone, index) => (
              <li key={index} className="text-sm">
                <div className="font-medium">
                  {milestone.is_external ? (
                    milestone.url ? (
                      <>
                        {(() => {
                          const normalizedUrl = normalizeExternalMilestoneUrl(
                            milestone.url,
                          );

                          return (
                            <>
                              <Text component="span" color="gray" size="sm">
                                {formatDate(milestone.broadcast_at, locale)}
                                &nbsp;-&nbsp;
                              </Text>
                              <Link
                                href={normalizedUrl}
                                className="hover:underline text-primary dark:text-primary-600"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {milestone.milestone}
                              </Link>

                              <Badge
                                component="a"
                                href={normalizedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                color="pink"
                                radius="sm"
                                className="ml-2 cursor-pointer"
                                variant="light"
                                leftSection={<FaExternalLinkAlt />}
                              >
                                URL
                              </Badge>
                              {milestone.note && (
                                <Text c="dimmed" component="span" size="xs">
                                  <br />
                                  &nbsp;{milestone.note}
                                </Text>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        <Text component="span" color="gray" size="sm">
                          {formatDate(milestone.broadcast_at, locale)}
                          &nbsp;-&nbsp;
                        </Text>
                        <span>{milestone.milestone}</span>
                      </>
                    )
                  ) : (
                    <>
                      <Text component="span" color="gray" size="sm">
                        {formatDate(milestone.broadcast_at, locale)}
                        &nbsp;-&nbsp;
                      </Text>
                      <Link
                        href={buildMilestoneSearchHref(milestone.milestone)}
                        className="hover:underline text-primary dark:text-primary-600"
                      >
                        {milestone.milestone}
                      </Link>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">
            {t("frequentSongsTitle")}
          </h2>
          {top10.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              {t("noData")}
            </p>
          ) : (
            <ol className="list-decimal pl-5">
              {(() => {
                const maxCount = Math.max(...top10.map((t) => t.count), 1);
                return top10.map((s) => {
                  const query: Record<string, string> = {};
                  if (s.video_id) query.v = s.video_id;
                  if (s.start) query.t = `${s.start}s`;
                  if (isYearValid) query.q = `year:${displayYear}`;
                  const pct = Math.round((s.count / maxCount) * 100);

                  return (
                    <li key={`${s.title}-${s.artist}`} className="mb-2">
                      <div className="relative rounded overflow-hidden">
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-400 opacity-30"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-between px-2 py-1">
                          <Link
                            href={
                              query.v
                                ? `/?${new URLSearchParams(query).toString()}`
                                : "#"
                            }
                            className="block hover:underline"
                          >
                            <div className="font-medium">
                              {s.title}
                              <span className="text-sm text-gray-700 dark:text-light-gray-400">
                                &nbsp;-&nbsp;{s.artist}
                              </span>
                            </div>
                          </Link>
                          <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400 text-nowrap">
                            {s.count}
                            {t("timesSuffix")}
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

        <section>
          <h2 className="text-lg font-semibold mb-2">
            {t("frequentArtistsTitle")}
          </h2>
          {topArtists.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              {t("noData")}
            </p>
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
                          className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-green-400 to-emerald-600 dark:from-green-500 dark:to-emerald-400 opacity-30"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-between px-2 py-1">
                          <div className="font-medium">
                            <Link
                              href={`/?${new URLSearchParams(
                                query,
                              ).toString()}`}
                              className="block hover:underline"
                            >
                              {a.artist}
                            </Link>
                          </div>
                          <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400 text-nowrap">
                            {a.count}
                            {t("timesSuffix")}
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

        {/*　コラボ回数が多かったホロメン */}
        <section>
          <h2 className="text-lg font-semibold mb-2">
            {t("collabCountsTitle")}
          </h2>
          {collabCountsBySinger.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              {t("noData")}
            </p>
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
                          className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-purple-400 to-pink-600 dark:from-purple-500 dark:to-pink-400 opacity-30"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-between px-2 py-1">
                          <div className="font-medium">
                            <Link
                              href={`/?${new URLSearchParams(
                                query,
                              ).toString()}`}
                              className="block hover:underline"
                            >
                              {a.singer}
                            </Link>
                          </div>
                          <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400 text-nowrap">
                            {a.count}
                            {t("songsSuffix")}
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

        {/* 月別曲数 */}
        <section>
          <h2 className="text-lg font-semibold mb-2">{t("monthsTitle")}</h2>
          {monthsWithSongs.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-light-gray-400">
              {t("noData")}
            </p>
          ) : (
            <ul>
              {monthsWithSongs.map(([month, songs]) => (
                <li key={`month-${month}`} className="mb-2">
                  <div className="relative rounded overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-yellow-400 to-red-600 dark:from-yellow-500 dark:to-red-400 opacity-30"
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
                      <div className="font-medium">
                        {formatMonthLabel(month)}
                      </div>
                      <div className="ml-4 text-sm text-gray-700 dark:text-light-gray-400 text-nowrap">
                        {songs.length}
                        {t("songsSuffix")}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* オリ曲・カバー曲MV */}
      {songsFiltered.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">
            {t("originalAndCoverMV")} (
            {
              songsFiltered.filter((s) =>
                (s.tags || []).some(
                  (t) =>
                    t === "オリ曲" ||
                    t === "オリ曲MV" ||
                    t === "カバー曲" ||
                    t === "カバー曲MV" ||
                    t === "fes全体曲",
                ),
              ).length
            }
            )
            <Link
              href={`/?q=year:${displayYear}|original-songs`}
              className="ml-4 text-sm hover:underline text-primary dark:text-primary-300"
            >
              <FaPlay className="inline-block mr-1" />
              {t("originalLabel")}
            </Link>
            <Link
              href={`/?q=year:${displayYear}|tag:カバー曲`}
              className="ml-4 text-sm hover:underline text-primary dark:text-primary-300"
            >
              <FaPlay className="inline-block mr-1" />
              {t("coverLabel")}
            </Link>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
            {(songsFiltered || [])
              .filter((s) =>
                (s.tags || []).some(
                  (t) =>
                    t === "オリ曲" ||
                    t === "オリ曲MV" ||
                    t === "カバー曲" ||
                    t === "カバー曲MV" ||
                    t === "fes全体曲",
                ),
              )
              .sort(
                (a, b) =>
                  new Date(a.broadcast_at).getTime() -
                  new Date(b.broadcast_at).getTime(),
              )
              .map((g, i) => (
                <SummarySongCard
                  key={`${g.video_id || i}-special-${i}`}
                  song={g}
                  href={`/watch?v=${g.video_id || ""}${
                    g.start ? `&t=${g.start}` : ""
                  }&q=year:${displayYear}`}
                  locale={locale}
                />
              ))}
          </div>
        </section>
      )}

      {/* 2人以上で歌唱した歌枠 */}
      {collaborativeSongs.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">
            {t("collaborativeLabel", {
              count: (collaborativeSongs || []).length,
            })}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
            {(collaborativeSongs || []).map((s, index) => (
              <SummarySongCard
                key={`${s.video_id || ""}-collab-${s.start || ""}-${index}`}
                song={s}
                href={`/watch?v=${s.video_id || ""}${
                  s.start ? `&t=${s.start}` : ""
                }&q=year:${displayYear}`}
                locale={locale}
                showArtist={true}
                bottomContent={
                  <Text size="xs" c="dimmed" className="mt-1 line-clamp-2">
                    with{" "}
                    {s.sings
                      .filter((x) => x.trim() !== siteConfig.talentName)
                      .map((x) => x.trim())
                      .join("、")}
                  </Text>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section className="my-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">
            {t("videosTitle", { year: displayYear })}
          </h2>
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
              {t("viewModeTile")}
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
              {t("viewModeList")}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="mb-4">
          <div className="flex items-center">
            <Input
              type="search"
              name="search"
              placeholder={t("searchPlaceholder")}
              className="flex-1 border-gray-300 dark:border-gray-600 rounded-lg"
              value={searchValue}
              onChange={(event) => setSearchValue(event.currentTarget.value)}
              // 削除ボタン
              rightSection={
                <InputClearButton
                  onClick={() => {
                    setSearchValue("");
                    setSearchTerm("");
                  }}
                  aria-label={t("clearButtonLabel")}
                />
              }
            />
            <Button type="submit" className="ml-2">
              <HiSearch className="h-5 w-5" />
            </Button>
          </div>
        </form>

        {monthsWithSongs.length === 0 ? (
          <p className="text-sm text-gray-700 dark:text-light-gray-400">
            該当する動画はありません。
          </p>
        ) : (
          <div className="space-y-6">
            {monthsWithSongs.map(([month, monthSongs]) => (
              <div key={month}>
                <h3 className="text-md font-semibold mb-2 bg-primary-200 dark:bg-primary-900 p-2 ">
                  {formatMonthLabel(month)} ({monthSongs.length})
                </h3>
                {mounted && videoViewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
                    {monthSongs.map((g, i) => (
                      <SummarySongCard
                        key={`${g.video_id || i}-${i}`}
                        song={g}
                        href={`/watch?v=${g.video_id || ""}${
                          g.start ? `&t=${g.start}` : ""
                        }&q=year:${displayYear}`}
                        locale={locale}
                        bottomContent={
                          g.milestones &&
                          g.milestones.map((milestone, idx) => (
                            <div key={idx}>
                              <Badge color="pink" variant="sm">
                                {milestone}
                              </Badge>
                            </div>
                          ))
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const byVideo: Record<
                        string,
                        {
                          title: string;
                          id: string;
                          uri: string;
                          broadcast_at: Date;
                          songs: Song[];
                          milestones?: string[];
                        }
                      > = {};
                      monthSongs.forEach((s) => {
                        const id = s.video_id || `noid-${s.broadcast_at}`;
                        if (!byVideo[id])
                          byVideo[id] = {
                            title: s.video_title || t("unknown"),
                            id,
                            uri: s.video_uri || "",
                            broadcast_at: new Date(s.broadcast_at),
                            songs: [],
                          };
                        byVideo[id].songs.push(s);
                      });
                      return Object.values(byVideo).map(
                        (v: {
                          title: string;
                          id: string;
                          uri: string;
                          broadcast_at: Date;
                          songs: Song[];
                          milestones?: string[];
                        }) => (
                          <div
                            key={`v-${v.id}`}
                            className="border rounded p-2 bg-white dark:bg-gray-800 card-glassmorphism hover-lift-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {v.id && !v.id.startsWith("noid-") && (
                                  <Link
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
                                    />
                                  </Link>
                                )}
                                <div className="font-medium">
                                  <Text component="span" size="lg" fw={500}>
                                    {v.title}
                                  </Text>
                                  <div className="inline-block">
                                    <Badge
                                      color="red"
                                      radius="sm"
                                      variant="light"
                                      component="a"
                                      href={
                                        v.uri ||
                                        `https://www.youtube.com/watch?v=${v.id}`
                                      }
                                      target="_blank"
                                      leftSection={<FaYoutube />}
                                      className="ml-2 cursor-pointer"
                                    >
                                      YouTube
                                    </Badge>
                                    <Badge
                                      color="pink"
                                      radius="sm"
                                      variant="light"
                                      component="a"
                                      href={`/watch?v=${v.id}&q=year:${displayYear}`}
                                      target="_blank"
                                      leftSection={<FaPlay />}
                                      className="ml-2 cursor-pointer"
                                    >
                                      {t("searchInAppLabel")}
                                    </Badge>
                                  </div>
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    className="mt-1 line-clamp-2"
                                  >
                                    {formatDate(v.broadcast_at, locale)}
                                  </Text>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 dark:text-light-gray-400 whitespace-nowrap">
                                {v.songs.length}
                                {t("songsSuffix")}
                              </div>
                            </div>
                            <List
                              className="mt-2 ml-3 pl-4 list-decimal"
                              type="ordered"
                              start={1}
                              size="sm"
                            >
                              {v.songs.map((s: Song, idx: number) => (
                                <List.Item key={`${v.id}-${idx}`}>
                                  <Link
                                    href={`/watch?v=${v.id}${
                                      s.start ? `&t=${s.start}` : ""
                                    }&q=year:${displayYear}`}
                                    className="hover:underline hover:text-primary dark:hover:text-primary-300"
                                  >
                                    {s.title}
                                    {s.artist && (
                                      <Text
                                        size="xs"
                                        c="dimmed"
                                        component="span"
                                      >
                                        {" "}
                                        - {s.artist}
                                      </Text>
                                    )}
                                    {s.milestones &&
                                      s.milestones.map((milestone, mIdx) => (
                                        <Badge
                                          key={mIdx}
                                          color="pink"
                                          variant="sm"
                                          className="ml-2"
                                        >
                                          {milestone}
                                        </Badge>
                                      ))}
                                  </Link>
                                </List.Item>
                              ))}
                            </List>
                          </div>
                        ),
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
