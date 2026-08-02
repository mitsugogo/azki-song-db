import type { ActivityImportance } from "../types/activityImportance";

export const DEFAULT_ACTIVITY_IMPORTANCE: ActivityImportance = "normal";

const ACTIVITY_IMPORTANCE_RANK: Record<ActivityImportance, number> = {
  normal: 1,
  high: 2,
  extra_high: 3,
};

export function normalizeActivityImportance(
  value: unknown,
): ActivityImportance {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (value === 2) return "high";
    if (value === 3) return "extra_high";
    if (value === 1) return "normal";
  }

  const rawValue = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!rawValue) {
    return DEFAULT_ACTIVITY_IMPORTANCE;
  }

  const numericValue = Number(rawValue);
  if (Number.isInteger(numericValue)) {
    if (numericValue === 2) return "high";
    if (numericValue === 3) return "extra_high";
    if (numericValue === 1) return "normal";
  }

  const normalizedValue = rawValue.replace(/[\s_-]+/g, "");
  if (normalizedValue === "high") return "high";
  if (normalizedValue === "extrahigh") return "extra_high";
  if (normalizedValue === "normal" || normalizedValue === "通常") {
    return "normal";
  }

  return DEFAULT_ACTIVITY_IMPORTANCE;
}

export function getActivityImportanceRank(value: unknown) {
  return ACTIVITY_IMPORTANCE_RANK[normalizeActivityImportance(value)];
}

export function compareActivityImportanceDesc(a: unknown, b: unknown) {
  return getActivityImportanceRank(b) - getActivityImportanceRank(a);
}

export function getHigherActivityImportance(
  a: unknown,
  b: unknown,
): ActivityImportance {
  return getActivityImportanceRank(a) >= getActivityImportanceRank(b)
    ? normalizeActivityImportance(a)
    : normalizeActivityImportance(b);
}

export function getActivityImportanceItemClassName(value: unknown) {
  const importance = normalizeActivityImportance(value);
  if (importance === "extra_high") {
    return "rounded-lg border-2 border-primary/40 bg-primary/10 shadow-[0_12px_34px_rgba(190,24,93,0.16)] ring-1 ring-primary/15 dark:border-pink-200/40 dark:bg-pink-200/10 dark:ring-pink-200/15";
  }

  if (importance === "high") {
    return "rounded-lg border border-primary/25 bg-primary/5 shadow-[0_8px_24px_rgba(190,24,93,0.08)] dark:border-pink-200/25 dark:bg-pink-200/5";
  }

  return "";
}

export function getActivityImportanceTitleClassName(value: unknown) {
  const importance = normalizeActivityImportance(value);
  return importance === "normal" ? "" : "font-bold";
}

export function getActivityImportanceTextClassName(value: unknown) {
  const importance = normalizeActivityImportance(value);

  if (importance === "extra_high") {
    return "text-lg leading-7";
  }

  if (importance === "high") {
    return "text-base leading-6";
  }

  return "";
}
