"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  LuAlbum,
  LuDatabase,
  LuFlag,
  LuMusic2,
  LuRadio,
  LuTag,
  LuUsers,
  LuYoutube,
} from "react-icons/lu";
import { Link } from "@/i18n/navigation";
import type { AnniversaryDataStats } from "./anniversaryData";

type AnniversaryDataSectionProps = {
  stats: AnniversaryDataStats;
};

export function AnniversaryDataSection({ stats }: AnniversaryDataSectionProps) {
  const t = useTranslations("Journey.dataAnniversary");
  const locale = useLocale();
  const statItems = [
    { key: "entries", value: stats.entries, icon: LuDatabase },
    { key: "songs", value: stats.songs, icon: LuMusic2 },
    { key: "videos", value: stats.videos, icon: LuYoutube },
    { key: "archives", value: stats.archives, icon: LuRadio },
    { key: "artists", value: stats.artists, icon: LuUsers },
    { key: "albums", value: stats.albums, icon: LuAlbum },
    {
      key: "activityRecords",
      value: stats.activityRecords,
      icon: LuFlag,
    },
    { key: "songTags", value: stats.songTags, icon: LuTag },
  ] as const;

  const links = [
    { href: "/data", label: t("links.data") },
    { href: "/statistics", label: t("links.statistics") },
    { href: "/stream-archives", label: t("links.archives") },
    { href: "/activity", label: t("links.activity") },
  ] as const;

  return (
    <section
      id="anniversary-data"
      aria-labelledby="anniversary-data-title"
      className="relative scroll-mt-12 border-t border-white/10 bg-[#030711] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="font-mono text-sm tracking-[0.22em] text-cyan-200/75">
            {t("eyebrow")}
          </p>
          <h2
            id="anniversary-data-title"
            className="mt-3 font-serif text-4xl font-semibold text-white sm:text-6xl"
          >
            {t("title")}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            {t("description")}
          </p>
        </header>

        <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="min-w-0 bg-[#07101f] px-4 py-6 sm:px-5 sm:py-7"
              >
                <dt className="flex items-center gap-2 text-xs leading-5 text-slate-400">
                  <Icon className="shrink-0 text-cyan-300" aria-hidden="true" />
                  {t(`stats.${item.key}`)}
                </dt>
                <dd className="mt-3 font-mono text-3xl font-semibold text-white sm:text-4xl">
                  {item.value.toLocaleString(locale)}
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-pink-300/40 hover:bg-pink-300/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-xs leading-6 text-slate-600">{t("notice")}</p>
      </div>
    </section>
  );
}
