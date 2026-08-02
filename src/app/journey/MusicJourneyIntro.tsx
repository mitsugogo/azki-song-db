"use client";

import type { MouseEvent } from "react";
import { Button } from "@mantine/core";
import { LuChevronDown } from "react-icons/lu";
import { formatDate } from "@/app/lib/formatDate";
import type { JourneyChapter } from "./journeyData";

const routePointPositions = ["2%", "45.5%", "76%"] as const;

type MusicJourneyIntroProps = {
  chapters: JourneyChapter[];
  locale: string;
  title: string;
  period: string;
  description: string;
  startLabel: string;
  getLabel: (chapter: JourneyChapter) => string;
  onStart: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function MusicJourneyIntro({
  chapters,
  locale,
  title,
  period,
  description,
  startLabel,
  getLabel,
  onStart,
}: MusicJourneyIntroProps) {
  return (
    <section
      id="music-journey"
      className="relative scroll-mt-12 overflow-hidden border-t border-white/10 bg-[#050b17] px-5 py-20 text-center sm:px-8 lg:px-12 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_18%_12%,rgba(244,72,124,0.13),transparent_24%),radial-gradient(circle_at_82%_28%,rgba(34,211,238,0.11),transparent_22%),radial-gradient(circle,rgba(255,255,255,0.5)_0.6px,transparent_0.8px)] [background-size:auto,auto,42px_42px]"
      />
      <div className="relative mx-auto max-w-5xl">
        <p className="font-mono text-sm tracking-[0.22em] text-pink-300">
          {period}
        </p>
        <h2 className="mt-3 font-serif text-4xl font-semibold text-white sm:text-6xl lg:text-7xl">
          {title}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
          {description}
        </p>
        <Button
          component="a"
          href={chapters[0] ? `#${chapters[0].id}` : "#journey-loading"}
          size="lg"
          radius="md"
          color="pink"
          className="mt-8 min-w-48 shadow-[0_16px_50px_rgba(244,72,124,0.28)]"
          rightSection={<LuChevronDown />}
          onClick={onStart}
        >
          {startLabel}
        </Button>

        <div className="relative mx-auto mt-14 h-36 max-w-4xl sm:h-44">
          <svg
            viewBox="0 0 1000 180"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="music-journey-route"
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
                id="music-journey-continuation"
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
                id="music-journey-glow"
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
              stroke="url(#music-journey-route)"
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#music-journey-glow)"
            />
            <path
              d="M760 90 H1040"
              fill="none"
              stroke="url(#music-journey-continuation)"
              strokeWidth="2"
              strokeLinecap="round"
              filter="url(#music-journey-glow)"
            />
            {[20, 455, 760].map((x, index) => (
              <circle
                key={x}
                cx={x}
                cy={90}
                r="6"
                fill={index === 2 ? "#67e8f9" : "#f9a8d4"}
                filter="url(#music-journey-glow)"
              />
            ))}
          </svg>
          <div className="absolute inset-x-0 bottom-0">
            {chapters.map((chapter, index) => (
              <span
                key={chapter.id}
                className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center whitespace-nowrap font-mono text-[10px] tracking-wider text-slate-400 sm:text-xs"
                style={{ left: routePointPositions[index] }}
              >
                <span>{getLabel(chapter)}</span>
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
  );
}
