"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, Button } from "@mantine/core";
import { FaHome } from "react-icons/fa";
import { HiChevronRight } from "react-icons/hi";
import { breadcrumbClasses } from "../../theme";
import YearSummaryClient from "./YearSummaryClient";
import { useTranslations } from "next-intl";
import { ScrollToTopButton } from "../../components/ScrollToTopButton";

export default function SummaryYearClient(props: {
  initialSongs: any[];
  year: number | null;
  displayYearServer: number | null;
  rawYearParam: string;
}) {
  const { initialSongs, year, displayYearServer, rawYearParam } = props;
  const t = useTranslations("Summary");
  const minYear = 2018;
  const maxYear = new Date().getFullYear();
  const prevYear =
    typeof displayYearServer === "number" && displayYearServer > minYear
      ? displayYearServer - 1
      : null;
  const nextYear =
    typeof displayYearServer === "number" && displayYearServer < maxYear
      ? displayYearServer + 1
      : null;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickyTriggerRef = useRef<HTMLDivElement>(null);
  const [isStickyActive, setIsStickyActive] = useState(false);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = stickyTriggerRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStickyActive(entry.intersectionRatio < 1);
      },
      {
        root,
        threshold: 1,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className="grow p-2 lg:p-6 pb-6 overflow-auto"
    >
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

      <div ref={stickyTriggerRef} className="h-px w-full" aria-hidden="true" />

      <div
        className={`sticky top-0 z-20 mb-4 pb-2 ${
          isStickyActive
            ? "bg-white/90 p-4 backdrop-blur supports-backdrop-filter:bg-white/80 dark:bg-gray-900/90 dark:supports-backdrop-filter:bg-gray-900/80"
            : ""
        }`}
      >
        {/* 前年・翌年ページャー */}
        <div className="mb-4 w-full">
          {displayYearServer && (
            <div className="flex w-full items-center justify-between gap-3">
              {prevYear ? (
                <Button
                  component={Link}
                  href={`/summary/${prevYear}`}
                  variant="light"
                  size="sm"
                  radius="md"
                >
                  {`<< ${prevYear}${t("yearSuffix")}`}
                </Button>
              ) : (
                <div className="h-9 min-w-px" aria-hidden="true" />
              )}

              {nextYear ? (
                <Button
                  component={Link}
                  href={`/summary/${nextYear}`}
                  variant="light"
                  size="sm"
                  radius="md"
                >
                  {`${nextYear}${t("yearSuffix")} >>`}
                </Button>
              ) : (
                <div className="h-9 min-w-px" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h1 className="font-extrabold text-2xl">
            {displayYearServer
              ? `${displayYearServer}${t("yearSuffix")}`
              : t("page.title")}
          </h1>
        </div>
      </div>

      <YearSummaryClient
        initialSongs={initialSongs}
        year={
          typeof year === "number" && !Number.isNaN(year) ? year : undefined
        }
        displayYearServer={displayYearServer}
      />
      <ScrollToTopButton />
    </div>
  );
}
