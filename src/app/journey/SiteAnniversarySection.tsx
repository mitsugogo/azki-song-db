"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  LuDatabase,
  LuListMusic,
  LuMapPinned,
  LuRadio,
  LuRocket,
  LuSearch,
  LuSparkles,
} from "react-icons/lu";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/app/config/siteConfig";
import { formatDate } from "@/app/lib/formatDate";
import { SITE_ANNIVERSARY_MILESTONES } from "./siteAnniversaryData";

const milestoneIcons = {
  launch: LuRocket,
  database: LuDatabase,
  playlist: LuListMusic,
  discovery: LuSearch,
  renewal: LuSparkles,
  archives: LuRadio,
  community: LuMapPinned,
} as const;

export function SiteAnniversarySection() {
  const t = useTranslations("Journey.siteYear");
  const locale = useLocale();

  return (
    <section
      id="site-year"
      aria-labelledby="site-year-title"
      className="relative scroll-mt-12 border-t border-white/10 bg-[#050b17] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_15%_10%,rgba(244,72,124,0.14),transparent_26%),radial-gradient(circle_at_85%_35%,rgba(34,211,238,0.1),transparent_24%)]"
      />
      <div className="relative mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-sm tracking-[0.22em] text-pink-300">
            {t("eyebrow")}
          </p>
          <h2
            id="site-year-title"
            className="mt-3 font-serif text-4xl font-semibold text-white sm:text-6xl"
          >
            {t("title")}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            {t("description", { siteName: siteConfig.siteName })}
          </p>
          <p className="mt-4 font-mono text-xs tracking-[0.14em] text-slate-500">
            {formatDate(`${siteConfig.launchedAt}T00:00:00+09:00`, locale)} —{" "}
            {formatDate(
              `${siteConfig.firstAnniversaryAt}T00:00:00+09:00`,
              locale,
            )}
          </p>
        </header>

        <ol className="relative mt-14 grid gap-5 lg:grid-cols-2">
          {SITE_ANNIVERSARY_MILESTONES.map((milestone, index) => {
            const Icon = milestoneIcons[milestone.id];
            return (
              <li
                key={milestone.id}
                className={index === 0 ? "lg:col-span-2" : undefined}
              >
                <article className="group h-full rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-pink-300/35 hover:bg-white/[0.055] sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-pink-300/25 bg-pink-400/10 text-pink-200">
                      <Icon aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <time
                          dateTime={milestone.date}
                          className="font-mono text-xs tracking-[0.08em] text-cyan-200/75"
                        >
                          {formatDate(
                            `${milestone.date}T00:00:00+09:00`,
                            locale,
                          )}
                        </time>
                        <span className="font-mono text-[10px] text-slate-600">
                          {milestone.version}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                        {t(`milestones.${milestone.id}.title`)}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-400">
                        {t(`milestones.${milestone.id}.description`)}
                      </p>
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {milestone.features.map((feature) => (
                          <li key={`${milestone.id}-${feature.id}`}>
                            <Link
                              href={feature.href}
                              className="inline-flex rounded-full border border-cyan-200/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs text-cyan-100/85 transition hover:border-cyan-200/40 hover:bg-cyan-300/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                            >
                              {t(`features.${feature.id}`)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
