"use client";

import { Button } from "flowbite-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { FaYoutube } from "react-icons/fa6";
import Acknowledgment from "./Acknowledgment";
import { Drawer, Burger, Modal, Popover, Text, Tooltip } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { LiaExternalLinkAltSolid } from "react-icons/lia";
import ThemeToggle from "./ThemeToggle";

export function Header() {
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const [buildDate, setBuildDate] = useState("N/A");

  const isMobile = useMediaQuery("(max-width: 50em)");

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

  const baseNavigation = [
    { name: "TOP", href: "/" },
    { name: "Discography", href: "/discography" },
    { name: "統計情報", href: "/statistics" },
    { name: "全データ", href: "/data" },
  ];

  const navigation = useMemo(() => {
    const navItems = baseNavigation.map((item) => ({
      ...item,
      current: item.href !== "#" && item.href === currentPath,
    }));

    return navItems;
  }, [currentPath, isTopPage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleRouteChange = () => {
        setCurrentPath(window.location.pathname);
      };
      window.addEventListener("popstate", handleRouteChange);
      window.addEventListener("pushstate", handleRouteChange);
      return () => {
        window.removeEventListener("popstate", handleRouteChange);
        window.removeEventListener("pushstate", handleRouteChange);
      };
    }
  }, []);

  return (
    <>
      <header className="relative bg-primary dark:bg-primary-900 text-white">
        <div className="w-full px-2">
          <div className="relative flex h-12 md:h-16 items-center">
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
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <a
                href="https://www.youtube.com/@AZKi"
                target="_blank"
                className="hidden lg:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary-100 dark:text-primary-200 bg-primary-700 hover:bg-primary-600 dark:bg-primary-900 dark:hover:bg-primary-800 focus:border-primary-700 focus:ring-primary-700 dark:focus:ring-primary-700"
              >
                <FaYoutube className="mr-1" />
                AZKi Channel
              </a>
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
          {navigation.map((item) => {
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

          <hr className="my-2 border border-gray-200 dark:border-gray-600 md:hidden" />

          <div className="block relative md:absolute md:bottom-6 md:left-3">
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

            <hr className="my-2 border border-gray-200 dark:border-gray-600 w-full" />

            {buildDate && (
              <div className="text-xs text-gray-400 dark:text-light-gray-500 pl-3">
                Last Updated:{" "}
                {buildDate ? new Date(buildDate).toLocaleDateString() : ""}
              </div>
            )}
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
