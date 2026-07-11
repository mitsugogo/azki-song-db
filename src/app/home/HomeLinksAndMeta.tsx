"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { Link } from "../../i18n/navigation";
import { siteConfig } from "../config/siteConfig";

type HomeLinksAndMetaProps = {
  appVersion: string;
  buildDateLabel: string | null;
  copyrightYears: string;
  isLoading: boolean;
  songCount: number;
  songsUpdatedLabel: string | null;
};

export const HomeLinksAndMeta = memo(function HomeLinksAndMeta({
  appVersion,
  buildDateLabel,
  copyrightYears,
  isLoading,
  songCount,
  songsUpdatedLabel,
}: HomeLinksAndMetaProps) {
  const t = useTranslations("Home");

  return (
    <>
      <div className="mt-24 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={siteConfig.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-64 items-center justify-center rounded-full bg-red-600 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
        >
          <FaYoutube className="mr-2" />
          {siteConfig.channelName}
        </Link>
        <Link
          href={siteConfig.xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-64 items-center justify-center rounded-full bg-gray-900 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          <FaXTwitter className="mr-2" />
          {siteConfig.xName}
        </Link>
        <Link
          href="https://hololive.hololivepro.com/talents/azki/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-64 items-center justify-center rounded-full bg-cyan-600 hover-lift-animation px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-cyan-500 dark:bg-cyan-600 dark:text-white dark:hover:bg-cyan-500"
        >
          {t("hololiveOfficial")}
        </Link>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500/80 dark:text-gray-100/80">
        {isLoading
          ? t("statsLoading")
          : t("stats", {
              count: songCount.toLocaleString(),
              date: songsUpdatedLabel
                ? t("lastUpdated", { date: songsUpdatedLabel })
                : "",
            })}
        {!isLoading && buildDateLabel && songsUpdatedLabel ? (
          <>
            <br />
            Version{" "}
            <Link
              href={
                appVersion === "dev"
                  ? "https://github.com/mitsugogo/azki-song-db"
                  : `https://github.com/mitsugogo/azki-song-db/releases/tag/v${appVersion}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-primary dark:hover:text-pink-300"
            >
              {appVersion === "dev" ? "dev" : `v${appVersion}`}
            </Link>
            <br />
            Copylight © {copyrightYears} mitsugogo
          </>
        ) : null}
      </p>
    </>
  );
});
