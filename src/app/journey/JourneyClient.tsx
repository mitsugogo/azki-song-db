"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Button, Skeleton } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { LuChevronDown, LuHeadphones, LuHeart, LuPlay } from "react-icons/lu";
import { Link } from "@/i18n/navigation";
import { ScrollToTopButton } from "@/app/components/ScrollToTopButton";
import useArchives from "@/app/hook/useArchives";
import useFavorites from "@/app/hook/useFavorites";
import useMilestones from "@/app/hook/useMilestones";
import useSongPlayCounts from "@/app/hook/useSongPlayCounts";
import useSongs from "@/app/hook/useSongs";
import { fetchJsonDedup } from "@/app/lib/fetchDedup";
import { formatDate } from "@/app/lib/formatDate";
import { buildWatchHref } from "@/app/lib/watchUrl";
import { JourneyChapterSection } from "./JourneyChapterSection";
import { JourneyProgress } from "./JourneyProgress";
import {
  buildJourneyChapters,
  getJourneyTotals,
  getJourneyYouTubeVideoId,
} from "./journeyData";
import { scrollToJourneyChapter } from "./journeyScroll";

const HERO_ROUTE_POINT_POSITIONS = ["2%", "45.5%", "76%"] as const;

export default function JourneyClient() {
  const t = useTranslations("Journey");
  const summaryT = useTranslations("Summary");
  const locale = useLocale();
  const { allSongs, isLoading: isSongsLoading } = useSongs();
  const { items: archives, isLoading: isArchivesLoading } = useArchives();
  const { items: milestones, isLoading: isMilestonesLoading } = useMilestones();
  const { playCountState } = useSongPlayCounts();
  const { favorites } = useFavorites();
  const milestoneVideoIds = useMemo(
    () => [
      ...new Set(
        milestones.flatMap((milestone) => {
          const videoId = getJourneyYouTubeVideoId(milestone.url);
          return videoId ? [videoId] : [];
        }),
      ),
    ],
    [milestones],
  );
  const milestoneVideoIdsKey = milestoneVideoIds.join(",");
  const [videoTitlesById, setVideoTitlesById] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!milestoneVideoIdsKey) return;
    let mounted = true;

    fetchJsonDedup<Array<{ videoId?: string; title?: string }>>(
      `/api/yt/info?videoIds=${encodeURIComponent(milestoneVideoIdsKey)}`,
    ).then(({ data }) => {
      if (!mounted || !data) return;
      setVideoTitlesById(
        Object.fromEntries(
          data.flatMap((item) =>
            item.videoId && item.title ? [[item.videoId, item.title]] : [],
          ),
        ),
      );
    });

    return () => {
      mounted = false;
    };
  }, [milestoneVideoIdsKey]);

  const chapters = useMemo(
    () =>
      buildJourneyChapters({
        songs: allSongs,
        archives,
        milestones,
        playCountState,
        favorites,
        videoTitlesById,
      }),
    [
      allSongs,
      archives,
      favorites,
      milestones,
      playCountState,
      videoTitlesById,
    ],
  );
  const totals = useMemo(() => getJourneyTotals(chapters), [chapters]);
  const [activeChapterId, setActiveChapterId] = useState("");

  const getChapterLabel = (chapter: (typeof chapters)[number]) =>
    chapter.labelKey ? summaryT(chapter.labelKey) : chapter.fallbackLabel;

  const handleStartJourney = (event: MouseEvent<HTMLAnchorElement>) => {
    const firstChapter = chapters[0];
    if (!firstChapter) return;
    scrollToJourneyChapter(event, firstChapter.id);
  };

  useEffect(() => {
    if (chapters.length === 0) return;
    let animationFrame = 0;

    const updateActiveChapter = () => {
      animationFrame = 0;
      const elements = document.querySelectorAll<HTMLElement>(
        "[data-journey-chapter]",
      );
      if (elements.length === 0) return;

      const activationLine = window.innerHeight * 0.34;
      let activeElement = elements[0];
      for (const element of elements) {
        if (element.getBoundingClientRect().top > activationLine) break;
        activeElement = element;
      }
      setActiveChapterId((current) =>
        current === activeElement.id ? current : activeElement.id,
      );
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateActiveChapter);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [chapters]);

  const latestSong = useMemo(
    () =>
      [...chapters.flatMap((chapter) => chapter.songs)].sort(
        (left, right) =>
          new Date(right.broadcast_at).getTime() -
          new Date(left.broadcast_at).getTime(),
      )[0] ?? null,
    [chapters],
  );

  const isLoading = isSongsLoading || isArchivesLoading || isMilestonesLoading;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#030711] text-slate-100 [color-scheme:dark]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_18%_12%,rgba(244,72,124,0.13),transparent_24%),radial-gradient(circle_at_82%_28%,rgba(34,211,238,0.11),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.07),transparent_30%),radial-gradient(circle,rgba(255,255,255,0.5)_0.6px,transparent_0.8px)] [background-size:auto,auto,auto,42px_42px]"
      />

      <section className="relative flex min-h-[calc(100dvh-2.5rem)] items-center justify-center overflow-hidden px-5 py-20 text-center sm:px-8 lg:min-h-[calc(100dvh-4rem)]">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 top-[42%] bg-linear-to-b from-transparent via-[#071325]/40 to-[#071325]"
        />
        <div className="relative z-10 mx-auto max-w-5xl">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
            AZKi Music Journey
          </h1>
          <p className="mt-4 font-mono text-xl tracking-[0.2em] text-pink-300 sm:text-2xl">
            2018 — NOW
          </p>
          <p className="mt-7 text-lg tracking-[0.08em] text-slate-200 sm:text-2xl">
            {t("hero.subtitle")}
          </p>
          <Button
            component="a"
            href={chapters[0] ? `#${chapters[0].id}` : "#journey-loading"}
            size="lg"
            radius="md"
            color="pink"
            className="mt-9 min-w-48 shadow-[0_16px_50px_rgba(244,72,124,0.28)]"
            rightSection={<LuChevronDown />}
            onClick={handleStartJourney}
          >
            {t("hero.start")}
          </Button>

          <div className="relative mx-auto mt-16 h-36 max-w-4xl sm:h-44">
            <svg
              viewBox="0 0 1000 180"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="journey-route"
                  gradientUnits="userSpaceOnUse"
                  x1="20"
                  y1="90"
                  x2="760"
                  y2="90"
                >
                  <stop offset="0" stopColor="#f472b6" />
                  <stop offset="0.52" stopColor="#f9a8d4" />
                  <stop offset="1" stopColor="#67e8f9" />
                </linearGradient>
                <linearGradient
                  id="journey-route-continuation"
                  gradientUnits="userSpaceOnUse"
                  x1="760"
                  y1="90"
                  x2="1040"
                  y2="90"
                >
                  <stop offset="0" stopColor="#67e8f9" stopOpacity="0.9" />
                  <stop offset="0.65" stopColor="#67e8f9" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
                </linearGradient>
                <filter
                  id="journey-glow"
                  filterUnits="userSpaceOnUse"
                  x="-50"
                  y="-50"
                  width="1100"
                  height="280"
                >
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M20 90 H760"
                fill="none"
                stroke="url(#journey-route)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#journey-glow)"
              />
              <path
                d="M760 90 H1040"
                fill="none"
                stroke="url(#journey-route-continuation)"
                strokeWidth="2"
                strokeLinecap="round"
                filter="url(#journey-glow)"
              />
              {[20, 455, 760].map((x, index) => (
                <circle
                  key={x}
                  cx={x}
                  cy={90}
                  r="6"
                  fill={index === 2 ? "#67e8f9" : "#f9a8d4"}
                  filter="url(#journey-glow)"
                />
              ))}
            </svg>
            <div className="absolute inset-x-0 bottom-0">
              {chapters.map((chapter, index) => (
                <span
                  key={chapter.id}
                  className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center whitespace-nowrap font-mono text-[10px] tracking-wider text-slate-400 sm:text-xs"
                  style={{ left: HERO_ROUTE_POINT_POSITIONS[index] }}
                >
                  <span>{getChapterLabel(chapter)}</span>
                  <time
                    dateTime={chapter.from}
                    className="mt-1 text-[8px] tracking-[0.12em] text-slate-500 sm:text-[10px]"
                  >
                    {formatDate(`${chapter.from}T00:00:00+09:00`, locale)}
                  </time>
                </span>
              ))}
            </div>
            <span className="absolute bottom-0 right-0 font-mono text-[10px] tracking-[0.2em] text-cyan-200/70 sm:text-xs">
              NOW →
            </span>
          </div>
        </div>
      </section>

      <div id="journey-loading" className="relative border-t border-white/10">
        {isLoading && chapters.length === 0 ? (
          <JourneyLoading />
        ) : (
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[180px_minmax(0,1fr)]">
            <aside className="relative hidden border-r border-white/10 px-8 lg:block">
              <JourneyProgress
                chapters={chapters}
                activeChapterId={activeChapterId}
                getLabel={getChapterLabel}
              />
            </aside>
            <div className="min-w-0">
              <div className="lg:hidden">
                <JourneyProgress
                  chapters={chapters}
                  activeChapterId={activeChapterId}
                  getLabel={getChapterLabel}
                />
              </div>
              {chapters.map((chapter, index) => (
                <JourneyChapterSection
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  label={getChapterLabel(chapter)}
                />
              ))}

              <section className="relative border-t border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
                <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <p className="font-mono text-sm tracking-[0.22em] text-cyan-200/75">
                      {t("current.eyebrow")}
                    </p>
                    <h2 className="mt-3 font-serif text-5xl font-semibold text-white sm:text-6xl">
                      {t("current.title")}
                    </h2>
                    <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                      {t("current.description", {
                        songs: totals.songs,
                        milestones: totals.milestones,
                        archives: totals.archives,
                      })}
                    </p>
                    <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                      <span className="inline-flex items-center gap-2">
                        <LuHeadphones className="text-cyan-300" />
                        {t("footprint.totalPlays", { count: totals.plays })}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <LuHeart className="text-pink-300" />
                        {t("footprint.totalFavorites", {
                          count: totals.favorites,
                        })}
                      </span>
                    </div>
                  </div>

                  {latestSong ? (
                    <div className="min-w-0 lg:w-[360px]">
                      <p className="text-xs text-slate-500">
                        {t("current.latest")}
                      </p>
                      <p className="mt-2 truncate text-xl font-semibold text-white">
                        {latestSong.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatDate(latestSong.broadcast_at, locale)}
                      </p>
                      <Button
                        component={Link}
                        href={buildWatchHref({
                          videoId: latestSong.video_id,
                          start: latestSong.start,
                        })}
                        variant="outline"
                        color="cyan"
                        size="md"
                        className="mt-5"
                        leftSection={<LuPlay />}
                      >
                        {t("current.play")}
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="mx-auto mt-16 max-w-6xl border-t border-white/10 pt-5 text-[11px] leading-5 text-slate-600">
                  {t("dataNotice")}
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
      <ScrollToTopButton />
    </main>
  );
}

function JourneyLoading() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8" aria-busy="true">
      <Skeleton height={18} width={120} color="dark.7" />
      <Skeleton height={54} width="45%" mt="md" color="dark.7" />
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <Skeleton height={340} radius="lg" color="dark.7" />
        <div className="space-y-5">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} height={54} color="dark.7" />
          ))}
        </div>
      </div>
    </div>
  );
}
