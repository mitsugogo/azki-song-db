const surface =
  "rounded-2xl border border-pink-200/70 bg-white/70 shadow-[0_12px_36px_rgba(190,24,93,0.08)] backdrop-blur dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_12px_36px_rgba(0,0,0,0.2)]";
const action =
  "flex shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary transition group-hover:bg-primary/5 dark:border-pink-200/20 dark:text-pink-100 dark:group-hover:bg-pink-200/10";

export const homeHighlightCardClasses = {
  card: `${surface} flex items-center gap-3 p-3 sm:gap-4 sm:p-4`,
  compactCard: `${surface} flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3`,
  interactive:
    "group transition hover:border-primary/40 hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary dark:hover:border-pink-300/30 dark:hover:bg-gray-900/90",
  action: `${action} size-8 sm:size-10`,
  compactAction: `${action} size-7 sm:size-8`,
};
