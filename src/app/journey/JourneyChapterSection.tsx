"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LuExternalLink,
  LuFlag,
  LuHeadphones,
  LuHeart,
  LuPlay,
  LuRadio,
} from "react-icons/lu";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { zenMaruGothic } from "@/app/fonts";
import { formatDate } from "@/app/lib/formatDate";
import { buildWatchHref } from "@/app/lib/watchUrl";
import {
  groupJourneyMomentsByDate,
  type JourneyChapter,
  type JourneyMomentKind,
} from "./journeyData";

type JourneyChapterSectionProps = {
  chapter: JourneyChapter;
  index: number;
  label: string;
};

const momentIcons: Record<JourneyMomentKind, typeof LuFlag> = {
  milestone: LuFlag,
  archive: LuRadio,
};

const chapterDescriptionKeyByLabelKey = {
  "routes.alpha": "chapterDescriptions.alpha",
  "routes.beta": "chapterDescriptions.beta",
  "routes.gamma": "chapterDescriptions.gamma",
} as const;

export function JourneyChapterSection({
  chapter,
  index,
  label,
}: JourneyChapterSectionProps) {
  const t = useTranslations("Journey");
  const locale = useLocale();
  const reversed = index % 2 === 1;
  const journeyDays = groupJourneyMomentsByDate(chapter.moments);
  const chapterDescriptionKey = chapter.labelKey
    ? chapterDescriptionKeyByLabelKey[
        chapter.labelKey as keyof typeof chapterDescriptionKeyByLabelKey
      ]
    : undefined;

  return (
    <section
      id={chapter.id}
      data-journey-chapter
      className="relative scroll-mt-20 border-t border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
    >
      <div
        aria-hidden="true"
        className={`absolute top-24 size-72 rounded-full blur-[130px] ${
          reversed ? "right-0 bg-cyan-400/10" : "left-0 bg-pink-400/10"
        }`}
      />
      <div className="relative mx-auto max-w-6xl">
        <header
          className={`mb-10 flex flex-col gap-3 ${reversed ? "lg:items-end lg:text-right" : ""}`}
        >
          <span className="font-mono text-sm tracking-[0.24em] text-cyan-200/70">
            {String(index + 1).padStart(2, "0")} / {label}
          </span>
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {chapter.from.slice(0, 4)} — {chapter.to?.slice(0, 4) ?? "NOW"}
          </h2>
          <p className="max-w-2xl text-pretty text-sm leading-7 text-slate-300 [word-break:auto-phrase] sm:text-base">
            {chapterDescriptionKey ? t(chapterDescriptionKey) : null}
          </p>
        </header>

        {chapter.representativeSongs.length > 0 ? (
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wide text-pink-200">
              {t("representativeSongsTitle")}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {chapter.representativeSongs.map((song) => (
                <Link
                  key={`${song.video_id}-${song.start}`}
                  href={buildWatchHref({
                    videoId: song.video_id,
                    start: song.start,
                  })}
                  className="group block overflow-hidden rounded-xl border border-white/15 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.32)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                >
                  <div className="relative">
                    <YoutubeThumbnail
                      videoId={song.video_id}
                      alt={song.video_title || song.title}
                      imageClassName="transition duration-700 group-hover:scale-[1.025]"
                    />
                    <span className="absolute inset-0 bg-linear-to-t from-[#02050d]/95 via-transparent to-transparent" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-12 items-center justify-center rounded-full border border-white/55 bg-black/45 text-white backdrop-blur transition duration-300 group-hover:scale-110 group-hover:bg-[#f4487c]">
                        <LuPlay className="ml-0.5 text-lg" />
                      </span>
                    </span>
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="block truncate text-base font-semibold text-white">
                        {song.title}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-300">
                        {formatDate(song.broadcast_at, locale)}
                      </span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <dl className="mt-7 grid grid-cols-3 border-y border-white/10">
          {[
            [t("counts.songs"), chapter.counts.songs],
            [t("counts.archives"), chapter.counts.archives],
            [t("counts.videos"), chapter.counts.videos],
          ].map(([term, value]) => (
            <div
              key={String(term)}
              className="border-white/10 px-3 py-4 sm:border-r sm:last:border-r-0"
            >
              <dt className="text-[11px] text-slate-500">{term}</dt>
              <dd className="mt-1 font-mono text-xl text-white">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
          <div>
            <h3 className="mb-8 text-lg font-semibold text-white">
              {t("timelineTitle")}
            </h3>
            <div className="relative pl-8">
              <span
                aria-hidden="true"
                className="absolute bottom-2 left-[7px] top-2 w-px bg-linear-to-b from-pink-300/70 via-cyan-300/45 to-transparent"
              />
              <ol className="space-y-7">
                {journeyDays.map((day) => {
                  return (
                    <li
                      key={day.dateKey}
                      data-journey-date={day.dateKey}
                      className="relative"
                    >
                      <span className="absolute -left-8 top-1 flex size-4 items-center justify-center rounded-full border border-white/20 bg-[#081426] text-pink-200 shadow-[0_0_14px_rgba(34,211,238,0.12)]">
                        <LuFlag className="text-[9px]" />
                      </span>
                      <time
                        dateTime={day.occurredAt}
                        className="font-mono text-[11px] text-cyan-200/70"
                      >
                        {formatDate(day.occurredAt, locale)}
                      </time>
                      <div className="mt-2 space-y-4">
                        {day.moments.map((moment) => {
                          const Icon = momentIcons[moment.kind];
                          const isExternal = moment.href?.startsWith("http");
                          const title = (
                            <span
                              className={
                                moment.prominent
                                  ? `${zenMaruGothic.className} text-xl font-bold leading-tight tracking-tight text-white transition group-hover:text-pink-200 sm:text-3xl`
                                  : "text-sm font-medium leading-6 text-slate-100 transition group-hover:text-pink-200 sm:text-base"
                              }
                            >
                              {moment.title}
                            </span>
                          );

                          return (
                            <article
                              key={moment.id}
                              data-journey-moment-kind={moment.kind}
                              data-journey-moment-featured={
                                moment.featured ? "true" : undefined
                              }
                              data-journey-moment-prominent={
                                moment.prominent ? "true" : undefined
                              }
                              className={
                                moment.prominent ? "group py-2" : "group"
                              }
                            >
                              <div className="flex items-start gap-2">
                                <Icon className="mt-1.5 shrink-0 text-xs text-pink-200/75" />
                                <div className="min-w-0 flex-1">
                                  {moment.href ? (
                                    <Link
                                      href={moment.href}
                                      target={isExternal ? "_blank" : undefined}
                                      rel={
                                        isExternal
                                          ? "noopener noreferrer"
                                          : undefined
                                      }
                                      className="inline-flex max-w-full items-start gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                                    >
                                      {title}
                                      {isExternal ? (
                                        <LuExternalLink
                                          className={`${moment.prominent ? "mt-2" : "mt-1.5"} shrink-0 text-xs text-slate-500`}
                                        />
                                      ) : null}
                                    </Link>
                                  ) : (
                                    title
                                  )}
                                  {moment.detail ? (
                                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                                      {moment.detail}
                                    </span>
                                  ) : null}
                                  {moment.media ? (
                                    <a
                                      href={moment.media.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`grid overflow-hidden border border-pink-300/25 bg-white/[0.045] transition hover:border-pink-300/55 hover:bg-white/[0.065] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300 ${
                                        moment.prominent
                                          ? "mt-4 max-w-3xl rounded-xl sm:grid-cols-[280px_minmax(0,1fr)]"
                                          : "mt-2.5 max-w-lg rounded-md sm:grid-cols-[150px_minmax(0,1fr)]"
                                      }`}
                                    >
                                      <YoutubeThumbnail
                                        videoId={moment.media.videoId}
                                        alt={moment.media.title}
                                      />
                                      <span
                                        className={`flex min-w-0 items-center font-medium text-slate-100 ${
                                          moment.prominent
                                            ? "gap-3 p-5 text-base leading-7 sm:text-lg"
                                            : "gap-2 p-2.5 text-xs leading-5 sm:text-[13px]"
                                        }`}
                                      >
                                        <LuPlay
                                          className={`shrink-0 text-pink-300 ${moment.prominent ? "text-lg" : "text-xs"}`}
                                        />
                                        <span>{moment.media.title}</span>
                                      </span>
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <aside className="border-l-2 border-cyan-300/55 bg-white/[0.035] px-5 py-4 lg:sticky lg:top-24">
            <p className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <LuHeadphones /> {t("footprint.title")}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <LuHeadphones className="text-cyan-300" />
                {t("footprint.plays", { count: chapter.personal.plays })}
              </span>
              <span className="inline-flex items-center gap-2">
                <LuHeart className="text-pink-300" />
                {t("footprint.favorites", {
                  count: chapter.personal.favorites,
                })}
              </span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
