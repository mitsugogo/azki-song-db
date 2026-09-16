import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { units } from "@/app/config/units";
import { pageClasses } from "@/app/theme";
import UnitBreadcrumbs from "./components/UnitBreadcrumbs";
import UnitCard from "./components/UnitCard";
import { buildUnitsIndexMetadata } from "./unitMetadata";

const comingSoonTileCount = 5;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Units", locale });
  return buildUnitsIndexMetadata({
    title: t("units"),
    description: t("indexDescription"),
    locale,
  });
}

export default async function UnitsPage() {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Units", locale });

  return (
    <main className={`${pageClasses.shell} w-full bg-white dark:bg-gray-950`}>
      <div className="mx-auto w-full max-w-7xl">
        <UnitBreadcrumbs homeLabel={t("home")} unitsLabel={t("units")} />

        <header>
          <h1 className={pageClasses.heading}>{t("units")}</h1>
          <p className={pageClasses.description}>{t("indexDescription")}</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => {
            const unitName = locale.startsWith("ja")
              ? unit.name.ja
              : unit.name.en;
            return (
              <UnitCard
                key={unit.slug}
                unit={unit}
                locale={locale}
                anniversaryLabel={t("cardAnniversary")}
                openLabel={t("openUnit", { name: unitName })}
              />
            );
          })}
          {Array.from({ length: comingSoonTileCount }, (_, index) => (
            <article
              key={index}
              aria-label={t("comingSoon")}
              className="flex aspect-video items-center justify-center rounded-3xl bg-gray-100 dark:bg-gray-800"
            >
              <span className="text-xs font-semibold tracking-[0.18em] text-gray-300 uppercase dark:text-gray-600">
                {t("comingSoon")}
              </span>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
