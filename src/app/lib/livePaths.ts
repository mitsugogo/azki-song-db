import type { LiveTitleGroup } from "@/app/types/live";

export const isValidLiveSlug = (slug: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);

export const findLiveTitleGroupBySlug = (
  groups: LiveTitleGroup[],
  pageSlug: string,
) => groups.find((group) => group.pageSlug === pageSlug);

export const getLiveTitlePath = (group: LiveTitleGroup) =>
  `/lives/${group.pageSlug || group.canonicalId}`;

export const getLiveComparisonPath = (group: LiveTitleGroup) =>
  group.performances.length > 1 ? `${getLiveTitlePath(group)}/all` : null;

export const getLivePerformancePath = (
  group: LiveTitleGroup,
  performanceId: string,
) => {
  const performance = group.performances.find(
    (candidate) => candidate.id === performanceId,
  );
  if (!performance) return null;
  if (group.pageSlug && performance.performanceSlug) {
    return `${getLiveTitlePath(group)}/${performance.performanceSlug}`;
  }
  const titlePath = getLiveTitlePath(group);
  return performanceId === group.canonicalId
    ? titlePath
    : `${titlePath}?performance=${encodeURIComponent(performanceId)}`;
};
