import type { MouseEvent } from "react";

export function scrollToJourneyChapter(
  event: MouseEvent<HTMLAnchorElement>,
  chapterId: string,
) {
  const target = document.getElementById(chapterId);
  if (!target) return;

  event.preventDefault();
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  target.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
  window.history.pushState(null, "", `#${chapterId}`);
}
