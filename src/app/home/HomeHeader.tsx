"use client";

import { Burger } from "@mantine/core";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LuSearch } from "react-icons/lu";
import { Link } from "../../i18n/navigation";
import { siteConfig } from "../config/siteConfig";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";

type HomeHeaderProps = {
  drawerOpened: boolean;
  onToggleDrawer: () => void;
};

export function HomeHeader({ drawerOpened, onToggleDrawer }: HomeHeaderProps) {
  const tDrawer = useTranslations("DrawerMenu");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateHeaderState = () => {
      setIsScrolled(window.scrollY > 12);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeaderState);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 -mx-4 isolate px-4 py-4 transition-colors duration-200 before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:transition-colors before:duration-200 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${
        isScrolled
          ? "before:bg-white/80 before:backdrop-blur dark:before:bg-gray-900/70"
          : "border-transparent before:bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Burger
            opened={drawerOpened}
            onClick={onToggleDrawer}
            aria-label="Toggle navigation"
          />
          <Link
            href="/"
            className="inline-block truncate text-base font-semibold tracking-[0.12em] text-primary dark:text-pink-200 sm:text-lg sm:tracking-[0.24em]"
          >
            {siteConfig.siteNameUpper}
          </Link>
        </div>

        <div className="flex shrink-0 items-center justify-end sm:gap-2">
          <nav className="hidden items-center gap-5 text-sm text-gray-600 dark:text-gray-100 sm:flex">
            <Link href="/search" className="hover:text-primary-500">
              <LuSearch className="mr-1 -mt-0.5 inline" />
              {tDrawer("search")}
            </Link>
            <Link href="/discography" className="hover:text-primary-500">
              {tDrawer("discography")}
            </Link>
            <Link href="/activity" className="hover:text-primary-500">
              {tDrawer("activity")}
            </Link>
            <Link href="/anniversaries" className="hover:text-primary-500">
              {tDrawer("anniversaries")}
            </Link>
            <Link href="/statistics" className="hover:text-primary-500">
              {tDrawer("statistics")}
            </Link>
          </nav>
          <LanguageSwitcher variant="light" />
          <ThemeToggle className="hover:text-primary-500 dark:hover:bg-primary-800 dark:hover:text-white" />
        </div>
      </div>
    </header>
  );
}
