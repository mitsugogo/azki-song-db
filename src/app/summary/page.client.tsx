"use client";

import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@mantine/core";
import { FaHome } from "react-icons/fa";
import { HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../theme";
import SummaryTopClient from "./client";
import { useTranslations } from "next-intl";

export default function SummaryPageClient() {
  const t = useTranslations("Summary");

  const activityStart = new Date(2018, 10, 15);
  const now = new Date();
  const activityDays =
    Math.floor(
      (now.getTime() - activityStart.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const years = now.getFullYear() - activityStart.getFullYear();
  let months = now.getMonth() - activityStart.getMonth();
  let days = now.getDate() - activityStart.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonthEnd.getDate();
  }
  let adjYears = years;
  if (months < 0) {
    adjYears -= 1;
    months += 12;
  }

  const avtivityDurationStr = t("duration", {
    years: String(adjYears),
    months: String(months),
    days: String(days),
  });

  return (
    <div className="grow lg:p-6 lg:pb-0">
      <div className="mb-4">
        <Breadcrumbs
          aria-label="Breadcrumb"
          className={breadcrumbClasses.root}
          separator={<HiChevronRight className={breadcrumbClasses.separator} />}
        >
          <Link href="/" className={breadcrumbClasses.link}>
            <FaHome className="inline mr-1" /> {t("homeLabel")}
          </Link>
          <Link href="/summary" className={breadcrumbClasses.link}>
            {t("page.title")}
          </Link>
        </Breadcrumbs>
      </div>

      <h1 className="font-extrabold text-2xl p-3">{t("page.title")}</h1>

      <div className="p-3">
        <p className="text-sm text-light-gray-400 mb-4">
          {t("page.description")}
        </p>
        <p className="text-sm text-light-gray-400 mb-4">
          {t("page.activityDays", {
            days: activityDays,
            duration: avtivityDurationStr,
          })}
        </p>

        <SummaryTopClient />
      </div>
    </div>
  );
}
