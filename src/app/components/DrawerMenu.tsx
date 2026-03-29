"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "flowbite-react";
import { Badge, Drawer, Modal, Tooltip } from "@mantine/core";
import { useMediaQuery, useViewportSize } from "@mantine/hooks";
import { useTranslations, useLocale } from "next-intl";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { MdInstallMobile } from "react-icons/md";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import Acknowledgment from "./Acknowledgment";
import { pageList } from "../pagelists";
import usePWAInstall from "../hook/usePWAInstall";
import useSongs from "../hook/useSongs";
import { formatDate } from "../lib/formatDate";
import { useGlobalPlayer } from "../hook/useGlobalPlayer";
import type { Song } from "../types/song";

type DrawerNavItem = {
  name: string;
  href: string;
  current?: boolean;
  label?: string;
};

type DrawerNavCategory = {
  category?: string;
  items: DrawerNavItem[];
};

type DrawerMenuProps = {
  opened: boolean;
  onClose: () => void;
};

type BuildInfo = {
  buildDate?: string;
  version?: string;
};

function buildBugReportUrl(currentSong: Song | null) {
  const base =
    "https://docs.google.com/forms/d/e/1FAIpQLScOZt6wOzE2okN5Pt7Ibf8nK64aoR4NM8Erw3cwgcFhNEIJ_Q/viewform?usp=pp_url&entry.385502129=";
  const debug = currentSong
    ? `title:${currentSong.title}&artist:${currentSong.artist}&video_id:${currentSong.video_id}&start:${currentSong.start}`
    : "";

  return base + encodeURIComponent(debug);
}

export default function DrawerMenu({ opened, onClose }: DrawerMenuProps) {
  const pathname = usePathname();
  const [buildDate, setBuildDate] = useState("N/A");
  const [appVersion, setAppVersion] = useState("N/A");
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const isMobile = useMediaQuery("(max-width: 50em)");
  const { height } = useViewportSize();
  const isShortViewport = (height || 0) < 840;
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const { songsFetchedAt } = useSongs();
  const { currentSong } = useGlobalPlayer();
  const t = useTranslations("DrawerMenu");
  const locale = useLocale();

  const categoryLabelMap: Record<string, string> = {
    活動の記録: t("categoryActivity"),
    シェア: t("categoryShare"),
  };

  const itemLabelMap: Record<string, string> = {
    "/": t("home"),
    "/search": t("search"),
    "/discography": t("discography"),
    "/summary": t("activity"),
    "/anniversaries": t("anniversaries"),
    "/statistics": t("statistics"),
    "/data": t("allData"),
    "/share/my-best-9-songs": t("myBest9Songs"),
  };

  const navigation = useMemo<DrawerNavCategory[]>(() => {
    return pageList.map((category) => ({
      ...category,
      items: category.items.map((item) => {
        const originalHref = item.href;
        const resolvedLabel = itemLabelMap[originalHref] ?? item.name;
        return {
          ...item,
          label: resolvedLabel,
          href: item.href,
          current: originalHref !== "#" && originalHref === pathname,
        };
      }),
    }));
  }, [pathname]);

  useEffect(() => {
    fetch("/build-info.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch build info: ${res.status}`);
        }
        return res.text().then((text) => {
          try {
            return JSON.parse(text);
          } catch {
            return {};
          }
        });
      })
      .then((data: BuildInfo) => {
        setBuildDate(data.buildDate ?? "N/A");
        setAppVersion(data.version ?? "N/A");
      })
      .catch((error) => {
        console.warn("Failed to fetch build info:", error);
        if (process.env.NODE_ENV === "development") {
          setBuildDate(new Date().toISOString());
          setAppVersion("dev");
        }
      });
  }, []);

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        title={t("title")}
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <div className="grow space-y-1">
          {navigation.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {category.category && (
                <div className="ml-3 mt-6 mb-2 text-xs font-semibold text-light-gray-300 dark:text-gray-300 uppercase">
                  {categoryLabelMap[category.category] ?? category.category}
                </div>
              )}
              {category.items.map((item) => {
                const isCurrent = item.current;
                const baseClasses =
                  "block rounded-md px-3 py-2 text-base font-medium cursor-pointer";
                const activeClasses =
                  "bg-primary-600 dark:bg-primary-800 text-white";
                const inactiveClasses =
                  "hover:bg-white/5 hover:text-primary dark:hover:text-white";

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`${isCurrent ? activeClasses : inactiveClasses} ${baseClasses}`}
                    onClick={onClose}
                  >
                    {item.label ?? item.name}
                  </Link>
                );
              })}
            </div>
          ))}
          <hr className="my-6 border border-light-gray-100 dark:border-gray-600" />

          <div className="ml-3 text-xs text-light-gray-300 dark:text-gray-300">
            {t("management")}
          </div>
          <Link
            href="/playlist"
            key="playlist"
            className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
            onClick={onClose}
          >
            {t("playlist")}
          </Link>

          <hr className="my-6 border border-light-gray-100 dark:border-gray-600" />

          {isInstallable && !isInstalled && (
            <>
              <div
                key="install-pwa"
                className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={() => {
                  promptInstall();
                  onClose();
                }}
              >
                <MdInstallMobile className="mr-2 inline text-xl" />
                {t("installApp")}
              </div>
              <hr className="my-6 border border-light-gray-200 dark:border-gray-600" />
            </>
          )}

          <Link
            href="#"
            key="about"
            className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
            onClick={() => {
              setShowAcknowledgment(true);
              onClose();
            }}
          >
            {t("about")}
          </Link>
          <hr className="my-6 border border-light-gray-200 dark:border-gray-600 md:hidden" />

          <div
            className={`block w-[calc(100%-1.5rem)] relative ${
              isShortViewport
                ? "md:static"
                : "md:absolute md:bottom-6 md:left-3"
            }`}
          >
            <Link
              href="https://www.youtube.com/@AZKi"
              target="_blank"
              className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
              onClick={onClose}
            >
              AZKi Channel
              <LiaExternalLinkAltSolid className="ml-3 inline text-right" />
            </Link>

            <Tooltip
              arrowOffset={10}
              arrowSize={4}
              label={t("soloLive")}
              withArrow
              position="top"
            >
              <Link
                href="https://departure.hololivepro.com/"
                target="_blank"
                className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={onClose}
              >
                <div className="text-xs text-gray-400 dark:text-light-gray-500">
                  2025.11.19 (Wed.) - PIA ARENA MM
                </div>{" "}
                AZKi SOLO LiVE 2025 &quot;Departure&quot;
                <LiaExternalLinkAltSolid className="ml-3 inline text-right" />
              </Link>
            </Tooltip>

            <hr className="my-2 border border-light-gray-200 dark:border-gray-600 w-full" />

            <div className="text-xs text-gray-400 dark:text-light-gray-500 pl-3 mb-1">
              {buildDate && songsFetchedAt && (
                <>
                  Version{" "}
                  <Link
                    href={
                      appVersion === "dev"
                        ? "https://github.com/mitsugogo/azki-song-db"
                        : `https://github.com/mitsugogo/azki-song-db/releases/tag/v${appVersion}`
                    }
                    target="_blank"
                    className="font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                  >
                    {appVersion === "dev" ? "dev" : `v${appVersion}`}
                  </Link>
                  <span className="mx-1"></span>
                  (Build: {formatDate(buildDate, locale)}, Songs:{" "}
                  {formatDate(songsFetchedAt, locale)})
                </>
              )}
            </div>

            <div className="text-[12px] text-gray-400 dark:text-light-gray-500 pl-3">
              <Link
                href="https://github.com/mitsugogo/azki-song-db/blob/main/CHANGELOG.md"
                target="_blank"
                className="font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={onClose}
              >
                <FaGithub className="inline -mt-1 mr-1" /> CHANGELOG
              </Link>
              <span className="ml-3"></span>
              <a
                href={buildBugReportUrl(currentSong)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={onClose}
              >
                {t("reportIssue")}
              </a>
            </div>

            <div className="text-[12px] text-gray-400 dark:text-light-gray-500 pl-3">
              Copylight © 2026 mitsugogo{" "}
              <Badge
                color="gray"
                variant="transparent"
                className="cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                size="xs"
                component={Link}
                target="_blank"
                href="https://github.com/mitsugogo/azki-song-db"
              >
                <FaXTwitter className="" />
              </Badge>
            </div>
          </div>
        </div>
      </Drawer>

      <Modal
        opened={showAcknowledgment}
        onClose={() => setShowAcknowledgment(false)}
        size="auto"
        title={t("about")}
        overlayProps={{ backgroundOpacity: 0.5, blur: 5 }}
        fullScreen={isMobile}
      >
        <Acknowledgment />
        <div className="mt-4 flex justify-end">
          <Button
            className="bg-primary hover:bg-primary text-white transition text-sm cursor-pointer"
            onClick={() => setShowAcknowledgment(false)}
          >
            {t("close")}
          </Button>
        </div>
      </Modal>
    </>
  );
}
