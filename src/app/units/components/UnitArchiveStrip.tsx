"use client";

import { Skeleton } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import { useUnitArchives } from "./useUnitArchives";

export default function UnitArchiveStrip({
  participants,
  unitName,
}: {
  participants: string[];
  unitName: string;
}) {
  const t = useTranslations("Units");
  const { items, isLoading } = useUnitArchives(participants);
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const isHoveredRef = useRef(false);
  const isInteractingRef = useRef(false);
  const isFocusWithinRef = useRef(false);
  const archives = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.stream_started_at || b.published_at).getTime() -
          new Date(a.stream_started_at || a.published_at).getTime(),
      ),
    [items],
  );

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || isLoading || reducedMotion || archives.length <= 1) {
      return;
    }

    let animationFrame = 0;
    let previousTime = window.performance.now();
    const pixelsPerMillisecond = 0.018;

    const advance = (currentTime: number) => {
      const elapsed = Math.min(currentTime - previousTime, 50);
      previousTime = currentTime;

      if (!isPausedRef.current) {
        const maxScrollLeft =
          scrollElement.scrollWidth - scrollElement.clientWidth;
        if (maxScrollLeft > 0) {
          scrollElement.scrollLeft =
            scrollElement.scrollLeft >= maxScrollLeft - 1
              ? 0
              : Math.min(
                  maxScrollLeft,
                  scrollElement.scrollLeft + elapsed * pixelsPerMillisecond,
                );
        }
      }

      animationFrame = window.requestAnimationFrame(advance);
    };

    animationFrame = window.requestAnimationFrame(advance);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [archives.length, isLoading, reducedMotion]);

  const updateAutoScrollPause = () => {
    isPausedRef.current =
      isHoveredRef.current ||
      isInteractingRef.current ||
      isFocusWithinRef.current;
  };

  if (!isLoading && archives.length === 0) return null;

  return (
    <section
      className="mt-4"
      aria-label={t("archiveStripLabel", { name: unitName })}
    >
      <div
        ref={scrollRef}
        className="unit-archive-strip-scrollbar max-w-full overflow-x-auto overscroll-x-contain pb-3"
        onMouseEnter={() => {
          isHoveredRef.current = true;
          updateAutoScrollPause();
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          updateAutoScrollPause();
        }}
        onPointerDown={() => {
          isInteractingRef.current = true;
          updateAutoScrollPause();
        }}
        onPointerUp={() => {
          isInteractingRef.current = false;
          updateAutoScrollPause();
        }}
        onPointerCancel={() => {
          isInteractingRef.current = false;
          updateAutoScrollPause();
        }}
        onFocusCapture={() => {
          isFocusWithinRef.current = true;
          updateAutoScrollPause();
        }}
        onBlurCapture={() =>
          window.requestAnimationFrame(() => {
            isFocusWithinRef.current = Boolean(
              scrollRef.current?.contains(document.activeElement),
            );
            updateAutoScrollPause();
          })
        }
      >
        <ul className="flex w-max snap-x snap-proximity gap-3">
          {isLoading
            ? [0, 1, 2, 3].map((index) => (
                <li key={index} className="aspect-video w-44 shrink-0 sm:w-52">
                  <Skeleton height="100%" width="100%" radius="md" />
                </li>
              ))
            : archives.map((item) => (
                <li
                  key={item.video_id}
                  className="w-44 shrink-0 snap-start overflow-hidden rounded-lg border border-gray-200 bg-black sm:w-52 dark:border-white/25"
                >
                  <Link
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    aria-label={`${item.title} - ${t("watchOnYouTube")}`}
                    title={item.title}
                  >
                    <YoutubeThumbnail
                      videoId={item.video_id}
                      alt={item.title}
                      imageClassName="transition-opacity hover:opacity-90"
                    />
                  </Link>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}
