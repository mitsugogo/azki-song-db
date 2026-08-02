"use client";

import type { JourneyChapter } from "./journeyData";
import { scrollToJourneyChapter } from "./journeyScroll";

type JourneyProgressProps = {
  chapters: JourneyChapter[];
  activeChapterId: string;
  getLabel: (chapter: JourneyChapter) => string;
};

export function JourneyProgress({
  chapters,
  activeChapterId,
  getLabel,
}: JourneyProgressProps) {
  return (
    <nav
      aria-label="Journey progress"
      className="sticky top-0 z-20 border-b border-white/10 bg-[#050b17]/92 px-4 py-3 backdrop-blur-xl lg:top-4 lg:h-fit lg:border-b-0 lg:bg-transparent lg:px-0 lg:py-4 lg:backdrop-blur-none"
    >
      <ol className="mx-auto flex max-w-5xl items-center justify-between gap-2 lg:mx-0 lg:flex-col lg:items-start lg:gap-0">
        {chapters.map((chapter, index) => {
          const active = chapter.id === activeChapterId;
          return (
            <li
              key={chapter.id}
              className="relative flex flex-1 items-center lg:min-h-28 lg:w-full lg:flex-none lg:items-start"
            >
              {index < chapters.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-2 h-px w-full bg-white/15 lg:left-[7px] lg:top-3 lg:h-full lg:w-px"
                />
              ) : null}
              <a
                href={`#${chapter.id}`}
                aria-current={active ? "step" : undefined}
                onClick={(event) => scrollToJourneyChapter(event, chapter.id)}
                className="group relative z-10 flex w-full flex-col items-center gap-1 text-center lg:flex-row lg:items-start lg:gap-3 lg:text-left"
              >
                <span
                  className={`mt-0.5 size-4 shrink-0 rounded-full border-2 transition duration-300 lg:size-4 ${
                    active
                      ? "border-pink-200 bg-[#f4487c] shadow-[0_0_18px_rgba(244,72,124,0.8)]"
                      : "border-white/45 bg-[#071223] group-hover:border-cyan-200"
                  }`}
                />
                <span className="hidden min-w-0 lg:block">
                  <span
                    className={`block text-xs font-semibold transition ${
                      active ? "text-pink-200" : "text-slate-400"
                    }`}
                  >
                    {getLabel(chapter)}
                  </span>
                  <span className="mt-1 block font-mono text-[10px] text-slate-500">
                    {chapter.from.slice(0, 4)} —{" "}
                    {chapter.to?.slice(0, 4) ?? "NOW"}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
