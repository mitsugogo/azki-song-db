"use client";

import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@mantine/core";
import { FaHome } from "react-icons/fa";
import { HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";
import YearSummaryClient from "./YearSummaryClient";
import { useTranslations } from "next-intl";

export default function SummaryYearClient(props: {
  initialSongs: any[];
  year: number | null;
  displayYearServer: number | null;
  rawYearParam: string;
}) {
  const { initialSongs, year, displayYearServer, rawYearParam } = props;
  const t = useTranslations("Summary");

  return (
    <div className="grow p-2 lg:p-6 lg:pb-0 overflow-auto">
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
          <Link
            href={`/summary/${rawYearParam}`}
            className={breadcrumbClasses.link}
          >
            {displayYearServer
              ? `${displayYearServer}${t("yearSuffix")}`
              : t("page.title")}
          </Link>
        </Breadcrumbs>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h1 className="font-extrabold text-2xl">
          {displayYearServer
            ? `${displayYearServer}${t("yearSuffix")}`
            : t("page.title")}
        </h1>
      </div>

      <YearSummaryClient
        initialSongs={initialSongs}
        year={
          typeof year === "number" && !Number.isNaN(year) ? year : undefined
        }
        displayYearServer={displayYearServer}
      />
    </div>
  );
}
