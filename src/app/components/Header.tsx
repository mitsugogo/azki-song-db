"use client";

import { Button } from "flowbite-react";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import { FaGithub, FaYoutube } from "react-icons/fa6";
import { MdInstallMobile } from "react-icons/md";
import Acknowledgment from "./Acknowledgment";
import { Drawer, Burger, Modal, Tooltip } from "@mantine/core";
import { useDisclosure, useMediaQuery, useViewportSize } from "@mantine/hooks";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import ThemeToggle from "./ThemeToggle";
import { pageList } from "../pagelists";
import FoldableToggle from "./FoldableToggle";
import usePWAInstall from "../hook/usePWAInstall";
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import { useGlobalPlayer } from "../hook/useGlobalPlayer";
import SearchInput from "./SearchInput";
import { useRouter } from "next/navigation";

export function Header() {
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const [buildDate, setBuildDate] = useState("N/A");

  const isMobile = useMediaQuery("(max-width: 50em)");

  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const { allSongs, songsFetchedAt } = useSongs();
  const { searchTerm, setSearchTerm } = useSearch(allSongs);
  const router = useRouter();
  const { currentSong } = useGlobalPlayer();

  useEffect(() => {
    fetch("/build-info.json")
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch build info: ${res.status}`);
        return res.text().then((text) => {
          try {
            return JSON.parse(text);
          } catch (e) {
            return {};
          }
        });
      })
      .then((data) => {
        setBuildDate(data.buildDate);
      })
      .catch((error) => {
        console.warn("Failed to fetch build info:", error);
        const isDev = process.env.NODE_ENV === "development";
        if (isDev) {
          setBuildDate(new Date().toISOString());
        }
      });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  const isTopPage = useMemo(() => currentPath === "/", [currentPath]);

  const navigation = useMemo(() => {
    const navCategories = pageList.map((category) => ({
      ...category,
      items: category.items.map((item) => ({
        ...item,
        current: item.href !== "#" && item.href === currentPath,
      })),
    }));

    return navCategories;
  }, [currentPath, isTopPage]);

  // 高さが不足している場合は左下固定をやめる
  const { height } = useViewportSize();
  const isShortViewport = (height || 0) < 840;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleRouteChange = () => {
        setCurrentPath(window.location.pathname);
      };
      window.addEventListener("popstate", handleRouteChange);
      // カスタムイベント(pushstate/replacestate)が発火されるように
      window.addEventListener("pushstate", handleRouteChange);
      window.addEventListener("replacestate", handleRouteChange);
      return () => {
        window.removeEventListener("popstate", handleRouteChange);
        window.removeEventListener("pushstate", handleRouteChange);
        window.removeEventListener("replacestate", handleRouteChange);
      };
    }
  }, []);

  return (
    <>
      <header className="relative bg-primary dark:bg-gray-800 text-white shadow-md">
        <div className="w-full px-2">
          <div className="relative flex h-10 lg:h-16 items-center">
            <div className="absolute inset-y-0 left-0 flex items-center z-10">
              <Burger
                opened={drawerOpened}
                onClick={toggleDrawer}
                color="white"
                aria-label="Toggle navigation"
              />
            </div>
            <div className="flex flex-1 items-center justify-center sm:justify-start sm:ml-12">
              <div className="flex shrink-0 items-center lg:ml-2">
                <a href="/">
                  <h1 className="text-lg lg:text-lg font-bold">
                    AZKi Song Database
                  </h1>
                </a>
              </div>
              {/* 検索フィールド - lg以上で表示 */}
              <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:mx-4">
                <div className="min-w-md max-w-full">
                  <SearchInput
                    allSongs={allSongs}
                    searchValue={
                      searchTerm
                        ? searchTerm.split("|").filter((v) => v.trim())
                        : []
                    }
                    onSearchChange={(values: string[]) => {
                      const query = values.join("|");

                      // 現在のパスを取得
                      const path =
                        typeof window !== "undefined"
                          ? window.location.pathname
                          : currentPath;

                      // TOPページと検索ページ以外では、検索ページに遷移
                      if (path !== "/" && path !== "/search") {
                        const searchUrl = query
                          ? `/search?q=${encodeURIComponent(query)}`
                          : "/search";
                        router.push(searchUrl);
                      } else {
                        // TOPページと検索ページでは、URLパラメータを更新
                        if (query) {
                          router.push(`${path}?q=${encodeURIComponent(query)}`);
                        } else {
                          router.push(path);
                        }
                      }
                    }}
                    placeholder="曲名、アーティスト、タグなどで検索"
                    className="[&_input]:h-7"
                  />
                </div>
              </div>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <Link
                href="https://www.youtube.com/@AZKi"
                target="_blank"
                className="hidden lg:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary-100 dark:text-primary-200 bg-primary-700 hover:bg-primary-600 dark:bg-primary-900/30 dark:hover:bg-primary-800 focus:border-primary-700 focus:ring-primary-700 dark:focus:ring-primary-700"
              >
                <FaYoutube className="mr-1" />
                AZKi Channel
              </Link>
              <FoldableToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title="Menu"
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <div className="flex-grow space-y-1">
          {navigation.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {category.category && (
                <div className="ml-3 mt-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
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
                    className={`${
                      isCurrent ? activeClasses : inactiveClasses
                    } ${baseClasses}`}
                    onClick={() => closeDrawer()}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
          <hr className="my-6 border border-light-gray-200 dark:border-gray-600 " />

          <div className="ml-3 text-xs text-light-gray-400 dark:text-gray-300">
            管理機能
          </div>
          <Link
            href="/playlist"
            key="playlist"
            className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
            onClick={() => closeDrawer()}
          >
            プレイリスト
          </Link>

          <hr className="my-6 border border-light-gray-200 dark:border-gray-600 " />

          {/* PWAインストールボタン */}
          {isInstallable && !isInstalled && (
            <>
              <div
                key="install-pwa"
                className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={() => {
                  promptInstall();
                  closeDrawer();
                }}
              >
                <MdInstallMobile className="mr-2 inline text-xl" />
                アプリをインストール
              </div>
              <hr className="my-6 border border-light-gray-200 dark:border-gray-600 " />
            </>
          )}

          <Link
            href="#"
            key="about"
            className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
            onClick={() => {
              setShowAcknowledgment(true);
              closeDrawer();
            }}
          >
            このサイトについて
          </Link>
          <hr className="my-6 border border-light-gray-200 dark:border-gray-600 md:hidden" />
          <div
            className={`block relative ${
              isShortViewport
                ? "md:static"
                : "md:absolute md:bottom-6 md:left-3"
            }`}
          >
            <Link
              href="https://www.youtube.com/@AZKi"
              target="_blank"
              className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
              onClick={() => closeDrawer()}
            >
              AZKi Channel
              <LiaExternalLinkAltSolid className="ml-3 inline text-right" />
            </Link>

            <Tooltip
              arrowOffset={10}
              arrowSize={4}
              label="ソロライブ！"
              withArrow
              position="bottom"
            >
              <Link
                href="https://departure.hololivepro.com/"
                target="_blank"
                className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={() => closeDrawer()}
              >
                <div className="text-xs text-gray-400 dark:text-light-gray-500">
                  2025.11.19 (Wed.) - PIA ARENA MM
                </div>{" "}
                AZKi SOLO LiVE 2025 &quot;Departure&quot;
                <LiaExternalLinkAltSolid className="ml-3 inline text-right" />
              </Link>
            </Tooltip>

            <hr className="my-2 border border-light-gray-200 dark:border-gray-600 w-full" />

            <div className="text-xs text-gray-400 dark:text-light-gray-500 pl-3">
              {buildDate && songsFetchedAt && (
                <>
                  Last Update:{" "}
                  {buildDate ? new Date(buildDate).toLocaleDateString() : ""}
                  <span className="ml-3"></span>
                  Songs -{" "}
                  {songsFetchedAt
                    ? new Date(songsFetchedAt).toLocaleDateString()
                    : ""}
                </>
              )}
            </div>

            <div className="text-[12px] text-gray-400 dark:text-light-gray-500 pl-3">
              <Link
                href="https://github.com/mitsugogo/azki-song-db"
                target="_blank"
                className="font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={() => closeDrawer()}
              >
                <FaGithub className="inline -mt-1 mr-1" /> GitHub
              </Link>
              <span className="ml-3"></span>
              <a
                href={(() => {
                  const base =
                    "https://docs.google.com/forms/d/e/1FAIpQLScOZt6wOzE2okN5Pt7Ibf8nK64aoR4NM8Erw3cwgcFhNEIJ_Q/viewform?usp=pp_url&entry.385502129=";
                  const s = currentSong;
                  const debug = s
                    ? `title:${s.title}&artist:${s.artist}&video_id:${s.video_id}&start:${s.start}`
                    : "";
                  return base + encodeURIComponent(debug);
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                onClick={() => closeDrawer()}
              >
                不具合報告
              </a>
            </div>
          </div>
        </div>
      </Drawer>

      <Modal
        opened={showAcknowledgment}
        onClose={() => setShowAcknowledgment(false)}
        size="auto"
        title="このサイトについて"
        overlayProps={{ opacity: 0.5, blur: 4 }}
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
