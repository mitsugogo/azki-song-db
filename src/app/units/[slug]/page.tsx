import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getUnitBySlug,
  getLocalizedUnitText,
  getUnitHeroFrameVars,
  units,
} from "@/app/config/units";
import { HomeHeroBackground } from "@/app/home/HomeHeroBackground";
import { fetchSongsFromApiCached } from "@/app/lib/server/fetchSongs";
import { getDiscographyLink } from "@/app/lib/song";
import {
  buildUnitHistory,
  getUnitActivityDays,
  getUnitAchievementSongs,
  getUnitKaraokeStreams,
  getUnitLegacyActivityDays,
  getUnitSingingStats,
  getUnitWorks,
  pickUnitHeroBackgroundSong,
} from "@/app/lib/unitHistory";
import { pageClasses } from "@/app/theme";
import UnitBreadcrumbs from "../components/UnitBreadcrumbs";
import UnitAnniversaryStatus from "../components/UnitAnniversaryStatus";
import UnitArchiveStrip from "../components/UnitArchiveStrip";
import UnitMemberAvatars from "../components/UnitMemberAvatars";
import UnitStats from "../components/UnitStats";
import UnitHistory from "../components/UnitHistory";
import UnitStreams from "../components/UnitStreams";
import UnitMusic from "../components/UnitMusic";
import UnitAchievements, {
  type UnitAchievementWork,
} from "../components/UnitAchievements";
import { buildUnitPageMetadata } from "../unitMetadata";

type UnitRouteParams = { params: Promise<{ slug: string }> };
type UnitPageProps = UnitRouteParams & {
  searchParams: Promise<{ previewDate?: string | string[] }>;
};

const getPreviewNow = (previewDate: string | string[] | undefined) => {
  const isDate =
    typeof previewDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(previewDate);
  const isDateTime =
    typeof previewDate === "string" &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(
      previewDate,
    );
  if (
    process.env.NODE_ENV === "production" ||
    typeof previewDate !== "string" ||
    (!isDate && !isDateTime)
  ) {
    return null;
  }
  const previewNow = new Date(
    isDate
      ? `${previewDate}T12:00:00+09:00`
      : `${previewDate}${previewDate.length === 16 ? ":00" : ""}+09:00`,
  );
  return Number.isNaN(previewNow.getTime()) ? null : previewNow;
};

export function generateStaticParams() {
  return units.map((unit) => ({ slug: unit.slug }));
}

export async function generateMetadata({
  params,
}: UnitRouteParams): Promise<Metadata> {
  const { slug } = await params;
  const unit = getUnitBySlug(slug);
  if (!unit) return {};
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Units", locale });
  const memberNames = unit.members.map((member) =>
    getLocalizedUnitText(member.name, locale),
  );
  return buildUnitPageMetadata({
    title: getLocalizedUnitText(unit.name, locale),
    description: t("description", {
      name: getLocalizedUnitText(unit.name, locale),
      members: new Intl.ListFormat(locale, {
        style: "long",
        type: "conjunction",
      }).format(memberNames),
    }),
    slug,
    locale,
  });
}

export default async function UnitPage({
  params,
  searchParams,
}: UnitPageProps) {
  const { slug } = await params;
  const { previewDate } = await searchParams;
  const unit = getUnitBySlug(slug);
  if (!unit) notFound();

  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Units", locale });
  const previewNow = getPreviewNow(previewDate);
  const now = previewNow ?? new Date();
  const songs = await fetchSongsFromApiCached({ locale }).catch(() => []);
  const works = getUnitWorks(songs, unit);
  const singingStats = getUnitSingingStats(songs, unit);
  const karaokeStreams = getUnitKaraokeStreams(songs, unit);
  const karaokeVideoIds = karaokeStreams.map((stream) => stream.videoId);
  const history = buildUnitHistory(unit, songs, locale, now);
  const unitName = getLocalizedUnitText(unit.name, locale);
  const legacyName = unit.legacy
    ? getLocalizedUnitText(unit.legacy.name, locale)
    : null;
  const memberNames = unit.members.map((member) =>
    getLocalizedUnitText(member.name, locale),
  );
  const archiveParticipants = unit.members
    .filter((member) => !member.aliases.includes("AZKi"))
    .map((member) => member.name.ja);
  const heroBackgroundSong = pickUnitHeroBackgroundSong(songs, unit);

  const achievementsByVideo = new Map<string, UnitAchievementWork>();
  getUnitAchievementSongs(works).forEach((song) => {
    if (!song.video_id) return;
    const previous = achievementsByVideo.get(song.video_id);
    const currentViewCount = Math.max(
      previous?.currentViewCount ?? 0,
      Number(song.view_count ?? 0),
    );
    achievementsByVideo.set(song.video_id, {
      title: previous?.title || song.title,
      videoId: song.video_id,
      youtubeHref: `https://www.youtube.com/watch?v=${encodeURIComponent(song.video_id)}`,
      databaseHref: `/watch?v=${encodeURIComponent(song.video_id)}&t=${song.start}`,
      statsHref: getDiscographyLink(song) ?? previous?.statsHref,
      currentViewCount,
      publishedAt: song.album_release_at || song.broadcast_at,
    });
  });

  return (
    <main className={`${pageClasses.shell} w-full bg-white dark:bg-gray-950`}>
      <div className="mx-auto w-full max-w-7xl">
        <UnitBreadcrumbs
          homeLabel={t("home")}
          unitsLabel={t("units")}
          unitName={unitName}
        />

        <section
          data-unit-hero-frame
          className="relative isolate overflow-hidden rounded-3xl border bg-white/90 p-6 [border-top-color:var(--unit-hero-top)] [border-right-color:var(--unit-hero-end)] [border-bottom-color:var(--unit-hero-end)] [border-left-color:var(--unit-hero-start)] dark:bg-gray-900/75 dark:[border-top-color:color-mix(in_srgb,var(--unit-hero-top)_30%,transparent)] dark:[border-right-color:color-mix(in_srgb,var(--unit-hero-end)_30%,transparent)] dark:[border-bottom-color:color-mix(in_srgb,var(--unit-hero-end)_30%,transparent)] dark:[border-left-color:color-mix(in_srgb,var(--unit-hero-start)_30%,transparent)] dark:[box-shadow:-8px_-8px_28px_color-mix(in_srgb,var(--unit-hero-start)_12%,transparent),8px_8px_28px_color-mix(in_srgb,var(--unit-hero-end)_10%,transparent)] sm:p-8 lg:p-10"
          style={getUnitHeroFrameVars(unit)}
        >
          <HomeHeroBackground song={heroBackgroundSong} layout="frame" />
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-white/65 dark:bg-gray-900/70"
            aria-hidden="true"
          />
          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(18rem,1fr)]">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-950 dark:text-white sm:text-5xl">
                {unitName}
              </h1>
              <p className="mt-3 text-lg font-semibold text-gray-700 dark:text-gray-200">
                {memberNames.join(" × ")}
              </p>
              <div className="mt-4 space-y-1 text-sm font-medium tracking-[0.12em] text-gray-500 dark:text-gray-100 dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">
                <p>
                  {t("since", { date: unit.formedAt.replaceAll("-", ".") })}
                </p>
                {unit.legacy && legacyName ? (
                  <p>
                    {t("legacyPeriod", {
                      name: legacyName,
                      start: unit.legacy.startedAt.replaceAll("-", "."),
                      end: unit.legacy.endedAt.replaceAll("-", "."),
                    })}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex justify-center">
              <UnitMemberAvatars members={memberNames} />
            </div>
            <div className="rounded-2xl border border-primary-200/50 bg-white p-5 dark:border-white/25 dark:bg-gray-900">
              <UnitAnniversaryStatus
                formedAt={unit.formedAt}
                anniversaryMonth={unit.anniversary.month}
                anniversaryDay={unit.anniversary.day}
                unitName={unitName}
                initialNowIso={now.toISOString()}
                freezeNow={previewNow !== null}
              />
            </div>
          </div>
        </section>

        <UnitArchiveStrip
          participants={archiveParticipants}
          karaokeVideoIds={karaokeVideoIds}
          unitName={unitName}
        />

        <UnitStats
          participants={archiveParticipants}
          unitName={unitName}
          unitSearchName={unit.name.ja}
          activityDays={getUnitActivityDays(unit, now)}
          legacyActivity={
            legacyName
              ? {
                  name: legacyName,
                  days: getUnitLegacyActivityDays(unit, now) ?? 0,
                }
              : undefined
          }
          uniqueSongCount={singingStats.uniqueSongCount}
          performanceCount={singingStats.performanceCount}
        />

        <UnitHistory entries={history} legacyName={legacyName ?? undefined} />
        <UnitStreams
          participants={archiveParticipants}
          karaokeVideoIds={karaokeVideoIds}
          karaokeStreams={karaokeStreams}
          unitName={unitName}
        />
        <UnitMusic
          unitName={unitName}
          works={works}
          singingStats={{
            uniqueSongCount: singingStats.uniqueSongCount,
            performanceCount: singingStats.performanceCount,
            ranked: singingStats.ranked,
          }}
        />
        <UnitAchievements works={[...achievementsByVideo.values()]} />
      </div>
    </main>
  );
}
