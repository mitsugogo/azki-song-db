import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { formatLiveDate } from "@/app/lib/liveSetlists";
import { resolveLiveId } from "@/app/lib/legacyLiveIds";
import {
  findLiveTitleGroupBySlug,
  getLiveComparisonPath,
  getLivePerformancePath,
  getLiveTitlePath,
} from "@/app/lib/livePaths";
import { fetchLiveTitleGroupsFromApi } from "@/app/lib/server/fetchLives";
import { pageClasses } from "@/app/theme";
import { routing } from "@/i18n/routing";
import LiveBreadcrumbs from "../../LiveBreadcrumbs";
import LiveComparisonClient from "../../LiveComparisonClient";
import LiveDetailClient from "../../LiveDetailClient";
import { buildLivePageMetadata } from "../../liveMetadata";

type PerformancePageProps = {
  params: Promise<{ liveId: string; performanceSlug: string }>;
  searchParams?: Promise<{ performance?: string | string[] }>;
};

const findPageTarget = (
  groups: Awaited<ReturnType<typeof fetchLiveTitleGroupsFromApi>>,
  liveId: string,
  performanceSlug: string,
) => {
  const isComparison = performanceSlug === "all";
  const group =
    findLiveTitleGroupBySlug(groups, liveId) ??
    (isComparison
      ? groups.find((candidate) => candidate.canonicalId === liveId)
      : undefined);
  const performance = isComparison
    ? undefined
    : group?.performances.find(
        (candidate) => candidate.performanceSlug === performanceSlug,
      );
  return {
    group,
    performance,
    isComparison: isComparison && !!group && group.performances.length > 1,
  };
};

export async function generateMetadata({
  params,
}: PerformancePageProps): Promise<Metadata> {
  const [{ liveId, performanceSlug }, groups, locale] = await Promise.all([
    params,
    fetchLiveTitleGroupsFromApi().catch(() => []),
    getLocale(),
  ]);
  const { group, performance, isComparison } = findPageTarget(
    groups,
    liveId,
    performanceSlug,
  );
  if (!group || (!performance && !isComparison)) return {};

  const tLives = await getTranslations({ namespace: "Lives", locale });
  const label = isComparison
    ? tLives("comparison")
    : performance!.performance || formatLiveDate(performance!.date, locale);
  const title = `${group.title} — ${label}`;
  const t = await getTranslations({ namespace: "Metadata.lives", locale });
  return buildLivePageMetadata({
    title,
    description: t(
      isComparison ? "comparisonDescription" : "detailDescription",
      { title: isComparison ? group.title : title },
    ),
    pathname: isComparison
      ? getLiveComparisonPath(group)!
      : getLivePerformancePath(group, performance!.id)!,
    locale,
  });
}

export default async function PerformancePage({
  params,
  searchParams,
}: PerformancePageProps) {
  const [{ liveId, performanceSlug }, resolvedSearchParams, groups, t, locale] =
    await Promise.all([
      params,
      searchParams ?? Promise.resolve<{ performance?: string | string[] }>({}),
      fetchLiveTitleGroupsFromApi(),
      getTranslations("Lives"),
      getLocale(),
    ]);
  const { group, performance, isComparison } = findPageTarget(
    groups,
    liveId,
    performanceSlug,
  );
  if (!group || (!performance && !isComparison)) notFound();
  if (resolvedSearchParams.performance !== undefined) {
    const requestedId =
      typeof resolvedSearchParams.performance === "string"
        ? resolveLiveId(resolvedSearchParams.performance)
        : undefined;
    const validRequestedId = group.performances.some(
      (candidate) => candidate.id === requestedId,
    )
      ? requestedId!
      : undefined;
    const path = validRequestedId
      ? getLivePerformancePath(group, validRequestedId)
      : isComparison
        ? getLiveComparisonPath(group)
        : getLivePerformancePath(group, performance!.id);
    if (!path) notFound();
    const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    permanentRedirect(`${localePrefix}${path}`);
  }

  return (
    <main className={pageClasses.shell}>
      <div className="mx-auto w-full">
        <LiveBreadcrumbs
          homeLabel={t("home")}
          livesLabel={t("lives")}
          liveTitle={group.title}
          liveTitleHref={getLiveTitlePath(group)}
          performanceLabel={
            isComparison
              ? t("comparison")
              : performance!.performance ||
                formatLiveDate(performance!.date, locale)
          }
        />
        {isComparison ? (
          <LiveComparisonClient group={group} />
        ) : (
          <LiveDetailClient
            group={group}
            initialPerformanceId={performance!.id}
          />
        )}
      </div>
    </main>
  );
}
