"use client";

import { Breadcrumbs } from "@mantine/core";
import { Link } from "@/i18n/navigation";
import { HiHome, HiChevronRight } from "react-icons/hi";
import { useTranslations } from "next-intl";
import { breadcrumbClasses } from "../theme";

export default function StatisticsBreadcrumb() {
  const t = useTranslations("Statistics.page");

  return (
    <Breadcrumbs
      aria-label="Breadcrumb"
      className={breadcrumbClasses.root}
      separator={<HiChevronRight className={breadcrumbClasses.separator} />}
    >
      <Link href="/" className={breadcrumbClasses.link}>
        <HiHome className="w-4 h-4 mr-1.5" /> {t("home")}
      </Link>
      <Link href="/statistics" className={breadcrumbClasses.link}>
        {t("title")}
      </Link>
    </Breadcrumbs>
  );
}
