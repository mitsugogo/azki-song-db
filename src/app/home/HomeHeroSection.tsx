"use client";

import { Text } from "@mantine/core";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, memo, useEffect, useMemo, useState } from "react";
import { FaYoutube } from "react-icons/fa6";
import { LuSparkles, LuVolumeX } from "react-icons/lu";
import { Link } from "../../i18n/navigation";
import { robotoFlex, zenMaruGothic } from "../fonts";
import { isAzkiBirthday } from "../lib/birthday";
import { formatDate } from "../lib/formatDate";
import { buildWatchHref } from "../lib/watchUrl";
import type { Song } from "../types/song";
import {
  buildHeroBackgroundVideoUrl,
  pickHeroBackgroundSong,
} from "./homeData";
import { HomeHeroBackground } from "./HomeHeroBackground";
import { HomeSearchPanel } from "./HomeSearchPanel";

const BIRTHDAY_BALLOONS = [
  { x: "8%", delay: "0s", duration: "13s", color: "#f472b6", size: "2.9rem" },
  { x: "18%", delay: "-5s", duration: "15s", color: "#38bdf8", size: "2.4rem" },
  { x: "29%", delay: "-9s", duration: "14s", color: "#facc15", size: "2.7rem" },
  { x: "42%", delay: "-2s", duration: "16s", color: "#a78bfa", size: "2.2rem" },
  {
    x: "55%",
    delay: "-7s",
    duration: "13.5s",
    color: "#34d399",
    size: "2.8rem",
  },
  {
    x: "68%",
    delay: "-3.5s",
    duration: "15.5s",
    color: "#fb7185",
    size: "2.5rem",
  },
  {
    x: "80%",
    delay: "-10s",
    duration: "14.5s",
    color: "#60a5fa",
    size: "2.6rem",
  },
  {
    x: "91%",
    delay: "-6s",
    duration: "16.5s",
    color: "#f97316",
    size: "2.3rem",
  },
] as const;

type HomeHeroSectionProps = {
  songs: Song[];
};

export const HomeHeroSection = memo(function HomeHeroSection({
  songs,
}: HomeHeroSectionProps) {
  const locale = useLocale();
  const t = useTranslations("Home");
  const [showBirthdayHero, setShowBirthdayHero] = useState(false);
  const backgroundSong = useMemo(() => pickHeroBackgroundSong(songs), [songs]);
  const backgroundVideoUrl = useMemo(
    () => (backgroundSong ? buildHeroBackgroundVideoUrl(backgroundSong) : null),
    [backgroundSong],
  );
  const backgroundWatchHref = useMemo(
    () =>
      backgroundSong
        ? buildWatchHref({ videoId: backgroundSong.video_id })
        : null,
    [backgroundSong],
  );

  useEffect(() => {
    setShowBirthdayHero(isAzkiBirthday());
  }, []);

  return (
    <section className="relative left-1/2 isolate flex min-h-[48dvh] w-screen -translate-x-1/2 flex-col items-center justify-center overflow-hidden py-10 text-center sm:py-16">
      <HomeHeroBackground song={backgroundSong} />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.42)_42%,rgba(253,242,248,0.9)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.42),rgba(15,23,42,0.72)_50%,rgba(15,23,42,0.94)_100%)]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 68%, rgba(0, 0, 0, 0.5) 80%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 68%, rgba(0, 0, 0, 0.5) 80%, transparent 100%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-56 bg-linear-to-b from-transparent via-[#fffafc]/70 to-transparent dark:via-[#111827]/70 sm:h-72" />
      {showBirthdayHero ? (
        <div
          className="birthday-balloons pointer-events-none absolute inset-0 z-[2] overflow-hidden"
          aria-hidden="true"
        >
          {BIRTHDAY_BALLOONS.map((balloon, index) => (
            <span
              key={`${balloon.x}-${index}`}
              className="birthday-balloon"
              style={
                {
                  "--balloon-x": balloon.x,
                  "--balloon-delay": balloon.delay,
                  "--balloon-duration": balloon.duration,
                  "--balloon-color": balloon.color,
                  "--balloon-size": balloon.size,
                } as CSSProperties
              }
            >
              <span className="birthday-balloon__shine" />
            </span>
          ))}
        </div>
      ) : null}
      {backgroundSong && backgroundVideoUrl && backgroundWatchHref ? (
        <div className="absolute right-3 top-1 z-20 flex max-w-[calc(100vw-2rem)] items-center gap-1.5 sm:right-6 sm:top-5">
          <Link
            href={backgroundVideoUrl}
            target="_blank"
            className="inline-flex min-w-0 text-nowrap items-center rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold text-gray-800 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:border-gray/40 hover:bg-white dark:border-white/10 dark:bg-gray-900/70 dark:text-white dark:shadow-black/20 dark:hover:border-pink-200/30 dark:hover:bg-gray-900/85 sm:px-3 sm:py-1.5 sm:text-xs"
            title={backgroundSong.video_title}
          >
            <Text
              size="sm"
              c="red"
              className="mt-0.5 mr-1 shrink-0 dark:text-white!"
            >
              <FaYoutube />
            </Text>
            <Text size="xs" fw={500} truncate="end">
              {backgroundSong.title}
            </Text>
            <Text
              c="dimmed"
              size="xs"
              className="ml-1 hidden sm:inline"
              component="span"
            >
              {backgroundSong.broadcast_at
                ? formatDate(backgroundSong.broadcast_at, locale)
                : null}
            </Text>
          </Link>
          <Link
            href={backgroundWatchHref}
            aria-label={t("heroWatchFromBeginning")}
            title={t("heroWatchFromBeginning")}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-gray-800 shadow-lg shadow-gray-900/10 backdrop-blur transition hover:border-gray/40 hover:bg-white dark:border-white/10 dark:bg-gray-900/70 dark:text-white dark:shadow-black/20 dark:hover:border-pink-200/30 dark:hover:bg-gray-900/85 sm:size-8"
          >
            <LuVolumeX className="text-sm sm:text-base" />
          </Link>
        </div>
      ) : null}
      <div className="relative z-10 flex w-full select-none flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="relative flex max-w-5xl flex-col items-center px-2 py-2 before:pointer-events-none before:absolute before:-inset-x-5 before:-inset-y-3 before:-z-10 before:rounded-4xl before:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.78),rgba(255,255,255,0.42)_58%,transparent_78%)] before:blur-xl dark:before:bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.58),rgba(15,23,42,0.3)_58%,transparent_78%)] sm:before:-inset-x-10 sm:before:-inset-y-5">
          <p className="mb-3 text-xs font-semibold tracking-[0.35em] text-primary/65 drop-shadow-[0_1px_12px_rgba(255,255,255,0.9)] dark:text-pink-200/75 dark:drop-shadow-[0_1px_12px_rgba(0,0,0,0.55)]">
            {t("brand")}
          </p>
          <h1
            className={`${zenMaruGothic.className} max-w-4xl text-balance text-4xl font-bold italic leading-tight text-light-gray-750/85 drop-shadow-[0_2px_18px_rgba(255,255,255,0.75)] dark:text-white/90 dark:drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-6xl`}
            style={{ fontStyle: "italic" }}
          >
            {t("heroLine1")}
            <br />
            <span className="hidden md:inline">{t("heroLine2")}</span>
            <span className="inline md:hidden">{t("heroLine2_short")}</span>
          </h1>
          {showBirthdayHero ? (
            <div
              className="relative mt-4 inline-flex max-w-[min(100%,36rem)] items-center justify-center overflow-hidden rounded-full border border-pink-200/70 bg-white/78 px-4 py-2 text-sm font-bold text-primary shadow-[0_14px_40px_rgba(190,24,93,0.18)] backdrop-blur dark:border-pink-200/20 dark:bg-gray-900/72 dark:text-pink-100 sm:px-5 sm:text-base"
              role="status"
              aria-label={t("birthdayAriaLabel")}
            >
              <span
                className="pointer-events-none absolute left-4 top-1 size-1.5 rounded-full bg-pink-300/80 motion-safe:animate-ping dark:bg-pink-200/70"
                aria-hidden="true"
              />
              <span
                className="pointer-events-none absolute right-6 bottom-1.5 size-1 rounded-full bg-primary/70 motion-safe:animate-pulse dark:bg-pink-100/80"
                aria-hidden="true"
              />
              <LuSparkles
                className="mr-2 shrink-0 text-base text-primary/80 dark:text-pink-200"
                aria-hidden="true"
              />
              <span className="text-balance">{t("birthdayMessage")}</span>
            </div>
          ) : null}
          <p className="mt-4 max-w-2xl text-sm font-medium text-gray-800/80 drop-shadow-[0_1px_12px_rgba(255,255,255,0.85)] dark:text-gray-100/80 dark:drop-shadow-[0_1px_12px_rgba(0,0,0,0.6)] sm:text-base">
            {t("description")}
          </p>
          <Link
            href="/journey"
            className={`${robotoFlex.className} mt-4 inline-flex items-center rounded-full border border-primary/25 bg-white/65 px-4 py-2 text-[0.68rem] font-semibold tracking-[0.08em] text-primary/80 shadow-[0_8px_28px_rgba(190,24,93,0.12)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-white/85 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:border-pink-200/25 dark:bg-gray-950/60 dark:text-pink-100/80 dark:shadow-[0_8px_28px_rgba(0,0,0,0.24)] dark:hover:border-pink-200/45 dark:hover:bg-gray-900/80 dark:hover:text-pink-100 sm:px-5 sm:text-xs`}
          >
            {t("anniversaryThanks")}
          </Link>
        </div>

        <HomeSearchPanel songs={songs} />
      </div>
    </section>
  );
});
