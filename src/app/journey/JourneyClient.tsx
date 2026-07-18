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
import { AnniversaryDataSection } from "./AnniversaryDataSection";
import { MusicJourneyIntro } from "./MusicJourneyIntro";
import { SiteAnniversarySection } from "./SiteAnniversarySection";
import { buildAnniversaryDataStats } from "./anniversaryData";
import {
  buildJourneyChapters,
  getJourneyTotals,
  getJourneyYouTubeVideoId,
} from "./journeyData";
import { scrollToJourneyChapter } from "./journeyScroll";

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
  const anniversaryStats = useMemo(
    () =>
      buildAnniversaryDataStats({
        songs: allSongs,
        archives,
        activityRecords: totals.milestones,
      }),
    [allSongs, archives, totals.milestones],
  );
  const [activeChapterId, setActiveChapterId] = useState("");

  const getChapterLabel = (chapter: (typeof chapters)[number]) =>
    chapter.labelKey ? summaryT(chapter.labelKey) : chapter.fallbackLabel;

  const handleStartAnniversary = (event: MouseEvent<HTMLAnchorElement>) => {
    scrollToJourneyChapter(event, "site-year");
  };

  const handleStartMusicJourney = (event: MouseEvent<HTMLAnchorElement>) => {
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
      <section className="relative flex min-h-[calc(100dvh-2.5rem)] items-center justify-center overflow-hidden px-5 py-20 text-center sm:px-8 lg:min-h-[calc(100dvh-4rem)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_18%_12%,rgba(244,72,124,0.13),transparent_24%),radial-gradient(circle_at_82%_28%,rgba(34,211,238,0.11),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.07),transparent_30%),radial-gradient(circle,rgba(255,255,255,0.5)_0.6px,transparent_0.8px)] [background-size:auto,auto,auto,42px_42px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 top-[42%] bg-linear-to-b from-transparent via-[#071325]/40 to-[#071325]"
        />
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="font-mono text-sm tracking-[0.28em] text-cyan-200/75 sm:text-base">
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 font-mono text-xl tracking-[0.2em] text-pink-300 sm:text-2xl">
            {t("hero.period")}
          </p>
          <p className="mt-7 text-lg tracking-[0.08em] text-slate-200 sm:text-2xl">
            {t("hero.subtitle")}
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            {t("hero.description")}
          </p>
          <Button
            component="a"
            href="#site-year"
            size="lg"
            radius="md"
            color="pink"
            className="mt-9 min-w-48 shadow-[0_16px_50px_rgba(244,72,124,0.28)]"
            rightSection={<LuChevronDown />}
            onClick={handleStartAnniversary}
          >
            {t("hero.start")}
          </Button>
        </div>
      </section>

      <SiteAnniversarySection />

      <div
        id="journey-loading"
        className="relative border-t border-white/10 bg-[#050b17]"
      >
        {isLoading && chapters.length === 0 ? (
          <JourneyLoading />
        ) : (
          <>
            <AnniversaryDataSection stats={anniversaryStats} />
            <MusicJourneyIntro
              chapters={chapters}
              locale={locale}
              title={t("musicJourney.title")}
              period={t("musicJourney.period")}
              description={t("musicJourney.description")}
              startLabel={t("musicJourney.start")}
              getLabel={getChapterLabel}
              onStart={handleStartMusicJourney}
            />
            <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[180px_minmax(0,1fr)]">
              <aside className="relative hidden border-r border-white/10 bg-[#050b17] px-8 lg:block">
                <JourneyProgress
                  chapters={chapters}
                  activeChapterId={activeChapterId}
                  getLabel={getChapterLabel}
                />
              </aside>
              <div className="min-w-0 bg-[#030711] [background-image:radial-gradient(circle_at_18%_12%,rgba(244,72,124,0.13),transparent_24%),radial-gradient(circle_at_82%_28%,rgba(34,211,238,0.11),transparent_22%),radial-gradient(circle_at_50%_70%,rgba(59,130,246,0.07),transparent_30%),radial-gradient(circle,rgba(255,255,255,0.5)_0.6px,transparent_0.8px)] [background-size:auto,auto,auto,42px_42px]">
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
          </>
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
