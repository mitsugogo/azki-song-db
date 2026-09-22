import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { findLiveTitleGroup } from "@/app/lib/liveSetlists";
import { resolveLiveId } from "@/app/lib/legacyLiveIds";
import {
  findLiveTitleGroupBySlug,
  getLivePerformancePath,
  getLiveTitlePath,
} from "@/app/lib/livePaths";
import { fetchLiveTitleGroupsFromApi } from "@/app/lib/server/fetchLives";
import { pageClasses } from "@/app/theme";
import { routing } from "@/i18n/routing";
import LiveBreadcrumbs from "../LiveBreadcrumbs";
import LiveDetailClient from "../LiveDetailClient";
import { buildLivePageMetadata } from "../liveMetadata";

type LivePageProps = {
  params: Promise<{ liveId: string }>;
  searchParams: Promise<{ performance?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: Pick<LivePageProps, "params">): Promise<Metadata> {
  const { liveId } = await params;
  const [groups, locale] = await Promise.all([
    fetchLiveTitleGroupsFromApi().catch(() => []),
    getLocale(),
  ]);
  const group =
    findLiveTitleGroupBySlug(groups, liveId) ??
    findLiveTitleGroup(groups, liveId);
  if (!group) return {};
  const t = await getTranslations({ namespace: "Metadata.lives", locale });
  const pathname = group.pageSlug
    ? (getLivePerformancePath(group, resolveLiveId(liveId)) ??
      getLivePerformancePath(group, group.canonicalId) ??
      getLiveTitlePath(group))
    : getLiveTitlePath(group);
  return buildLivePageMetadata({
    title: group.title,
    description: t("detailDescription", { title: group.title }),
    pathname,
    locale,
  });
}

export default async function LivePage({
  params,
  searchParams,
}: LivePageProps) {
  const [{ liveId }, resolvedSearchParams, t, groups, locale] =
    await Promise.all([
      params,
      searchParams,
      getTranslations("Lives"),
      fetchLiveTitleGroupsFromApi(),
      getLocale(),
    ]);
  const group =
    findLiveTitleGroupBySlug(groups, liveId) ??
    findLiveTitleGroup(groups, liveId);
  if (!group) notFound();

  const resolvedLiveId = resolveLiveId(liveId);
  const requestedPerformance =
    typeof resolvedSearchParams.performance === "string"
      ? resolveLiveId(resolvedSearchParams.performance)
      : group.canonicalId;
  if (group.pageSlug) {
    const targetId =
      liveId === group.pageSlug || resolvedLiveId === group.canonicalId
        ? group.performances.some(
            (performance) => performance.id === requestedPerformance,
          )
          ? requestedPerformance
          : group.canonicalId
        : resolvedLiveId;
    const path = getLivePerformancePath(group, targetId);
    if (!path) notFound();
    const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    permanentRedirect(`${localePrefix}${path}`);
  }
  if (liveId !== group.canonicalId) {
    const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    const redirectPerformanceId =
      resolvedLiveId === group.canonicalId &&
      group.performances.some(
        (performance) => performance.id === requestedPerformance,
      )
        ? requestedPerformance
        : resolvedLiveId;
    permanentRedirect(
      `${localePrefix}/lives/${group.canonicalId}${redirectPerformanceId === group.canonicalId ? "" : `?performance=${encodeURIComponent(redirectPerformanceId)}`}`,
    );
  }

  const initialPerformanceId = group.performances.some(
    (performance) => performance.id === requestedPerformance,
  )
    ? requestedPerformance
    : group.canonicalId;

  return (
    <main className={pageClasses.shell}>
      <div className="mx-auto w-full">
        <LiveBreadcrumbs
          homeLabel={t("home")}
          livesLabel={t("lives")}
          liveTitle={group.title}
        />
        <LiveDetailClient
          group={group}
          initialPerformanceId={initialPerformanceId}
        />
      </div>
    </main>
  );
}
