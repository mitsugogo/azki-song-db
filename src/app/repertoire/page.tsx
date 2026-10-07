import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@mantine/core";
import { getLocale, getTranslations } from "next-intl/server";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { Link } from "@/i18n/navigation";
import { breadcrumbClasses, pageClasses } from "@/app/theme";
import { buildLivePageMetadata } from "@/app/lives/liveMetadata";
import RepertoireClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ namespace: "Repertoire", locale });
  return buildLivePageMetadata({
    title: t("title"),
    description: t("description"),
    pathname: locale === "en" ? "/en/repertoire" : "/repertoire",
    locale,
  });
}

export default async function RepertoirePage() {
  const t = await getTranslations("Repertoire");
  return (
    <main className={pageClasses.shell}>
      <Breadcrumbs
        className={breadcrumbClasses.root}
        separator={<HiChevronRight className={breadcrumbClasses.separator} />}
      >
        <Link href="/" className={breadcrumbClasses.link}>
          <HiHome className="mr-1.5 h-4 w-4" />
          {t("home")}
        </Link>
        <span className={breadcrumbClasses.link}>{t("title")}</span>
      </Breadcrumbs>
      <h1 className={pageClasses.heading}>{t("title")}</h1>
      <p className={pageClasses.description}>{t("description")}</p>
      <Suspense fallback={null}>
        <RepertoireClient />
      </Suspense>
    </main>
  );
}
