"use client";

import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@mantine/core";
import { useTranslations } from "next-intl";
import { HiChevronRight, HiHome } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";

export default function SeichiMapRankingBreadcrumb() {
  const t = useTranslations("SeichiMapRanking");

  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="mr-1.5 h-4 w-4" />
        {t("home")}
      </Link>
      <Link href="/seichi-map" className={breadcrumbClasses.link}>
        {t("map")}
      </Link>
      <span className={breadcrumbClasses.link}>{t("title")}</span>
    </Breadcrumbs>
  );
}
