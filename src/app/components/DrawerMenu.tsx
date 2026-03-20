"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "flowbite-react";
import { Drawer, Modal, Tooltip } from "@mantine/core";
import { useMediaQuery, useViewportSize } from "@mantine/hooks";
import { FaGithub, FaXTwitter } from "react-icons/fa6";
import { MdInstallMobile } from "react-icons/md";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import Acknowledgment from "./Acknowledgment";
import { pageList } from "../pagelists";
import usePWAInstall from "../hook/usePWAInstall";
import useSongs from "../hook/useSongs";
import { useGlobalPlayer } from "../hook/useGlobalPlayer";
import type { Song } from "../types/song";

type DrawerNavItem = {
  name: string;
  href: string;
  current?: boolean;
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

  const navigation = useMemo<DrawerNavCategory[]>(() => {
    return pageList.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        current: item.href !== "#" && item.href === pathname,
      })),
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
        title="Menu"
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <div className="grow space-y-1">
          {navigation.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {category.category && (
                <div className="ml-3 mt-6 mb-2 text-xs font-semibold text-light-gray-300 dark:text-gray-300 uppercase">
                  {category.category}
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
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
          <hr className="my-6 border border-light-gray-100 dark:border-gray-600" />

          <div className="ml-3 text-xs text-light-gray-300 dark:text-gray-300">
            管理機能
          </div>
          <Link
            href="/playlist"
            key="playlist"
            className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
            onClick={onClose}
          >
            プレイリスト
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
                アプリをインストール
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
            このサイトについて
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
              label="ソロライブ！"
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
                  Version:{" "}
                  <Link
                    href={
                      appVersion === "dev"
                        ? "https://github.com/mitsugogo/azki-song-db"
                        : `https://github.com/mitsugogo/azki-song-db/releases/tag/v${appVersion}`
                    }
                    target="_blank"
                  >
                    <FaGithub className="inline -mt-1" />
                    {appVersion === "dev" ? "dev" : `v${appVersion}`}
                  </Link>
                  <span className="ml-3"></span>
                  Last Build: {new Date(buildDate).toLocaleDateString()}
                  <span className="ml-3"></span>
                  Songs: {new Date(songsFetchedAt).toLocaleDateString()}
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
                不具合報告
              </a>
            </div>

            <div className="text-[12px] text-gray-400 dark:text-light-gray-500 pl-3">
              <Link
                href="https://x.com/mitsugogo"
                target="_blank"
                className="font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={onClose}
              >
                <FaXTwitter className="inline -mt-1 mr-1" />
                @mitsugogo
              </Link>
            </div>
          </div>
        </div>
      </Drawer>

      <Modal
        opened={showAcknowledgment}
        onClose={() => setShowAcknowledgment(false)}
        size="auto"
        title="このサイトについて"
        overlayProps={{ backgroundOpacity: 0.5, blur: 5 }}
        fullScreen={isMobile}
      >
        <Acknowledgment />
        <div className="mt-4 flex justify-end">
          <Button
            className="bg-primary hover:bg-primary text-white transition text-sm cursor-pointer"
            onClick={() => setShowAcknowledgment(false)}
          >
            閉じる
          </Button>
        </div>
      </Modal>
    </>
  );
}
