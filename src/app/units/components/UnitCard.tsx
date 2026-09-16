import { HiArrowRight } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import YoutubeThumbnail from "@/app/components/YoutubeThumbnail";
import type { UnitDefinition } from "@/app/config/units";
import { getLocalizedUnitText } from "@/app/config/units";
import UnitMemberAvatars from "./UnitMemberAvatars";

const formatAnniversaryDate = (month: number, day: number, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, month - 1, day)));

export default function UnitCard({
  unit,
  locale,
  anniversaryLabel,
  openLabel,
}: {
  unit: UnitDefinition;
  locale: string;
  anniversaryLabel: string;
  openLabel: string;
}) {
  const unitName = getLocalizedUnitText(unit.name, locale);
  const memberNames = unit.members.map((member) =>
    getLocalizedUnitText(member.name, locale),
  );
  const anniversaryDate = formatAnniversaryDate(
    unit.anniversary.month,
    unit.anniversary.day,
    locale,
  );

  return (
    <article>
      <Link
        href={`/units/${unit.slug}`}
        aria-label={openLabel}
        className="group relative isolate block aspect-video overflow-hidden rounded-3xl border border-primary-300/30 bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-white/25 dark:bg-gray-900"
      >
        <div
          className="absolute inset-0 z-0 opacity-45 dark:opacity-35"
          aria-hidden="true"
        >
          <YoutubeThumbnail
            videoId={unit.cardBackgroundVideoId}
            alt=""
            className="h-full w-full"
            imageClassName={
              unit.cardBackgroundZoom
                ? "scale-[1.25] transition-transform duration-500 group-hover:scale-[1.28]"
                : "scale-[1.03] transition-transform duration-500 group-hover:scale-[1.06]"
            }
            objectFit="cover"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-white/75 dark:bg-gray-950/80"
          aria-hidden="true"
        />

        <div className="relative z-10 flex h-full flex-col justify-between gap-2 p-4 sm:gap-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white sm:text-3xl">
                {unitName}
              </h2>
              <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:mt-2">
                {memberNames.join(" × ")}
              </p>
              <p className="mt-2 text-[0.65rem] font-medium tracking-[0.12em] text-gray-500 dark:text-gray-100 dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.65)] sm:mt-3 sm:text-xs">
                Since {unit.formedAt.replaceAll("-", ".")}
              </p>
            </div>
            <div className="shrink-0">
              <UnitMemberAvatars members={memberNames} variant="card" />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="rounded-xl border border-white/70 bg-white/85 px-3 py-2 backdrop-blur-sm dark:border-white/25 dark:bg-gray-900/85 sm:rounded-2xl sm:px-4 sm:py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-primary-700 dark:text-pink-200 sm:text-xs">
                {anniversaryLabel}
              </p>
              <p className="mt-0.5 text-base font-black text-gray-950 dark:text-white sm:mt-1 sm:text-lg">
                {anniversaryDate}
              </p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-300/40 bg-white/85 text-primary-700 transition-colors group-hover:bg-primary-50 sm:h-11 sm:w-11 dark:border-white/25 dark:bg-gray-900/85 dark:text-pink-200 dark:group-hover:bg-pink-950/70">
              <HiArrowRight className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
