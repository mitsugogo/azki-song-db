"use client";

import { Burger } from "@mantine/core";
import { useTranslations } from "next-intl";
import { LuSearch } from "react-icons/lu";
import { Link } from "../../i18n/navigation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import AccountMenu from "../components/AccountMenu";
import HeaderContent from "../components/HeaderContent";

type HomeHeaderProps = {
  drawerOpened: boolean;
  onToggleDrawer: () => void;
  isScrolled?: boolean;
};

export function HomeHeader({
  drawerOpened,
  onToggleDrawer,
  isScrolled = false,
}: HomeHeaderProps) {
  const tDrawer = useTranslations("DrawerMenu");

  return (
    <header
      className={`relative isolate transition-colors duration-200 before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:transition-colors before:duration-200 ${
        isScrolled
          ? "before:bg-white/80 before:backdrop-blur dark:before:bg-gray-900/70"
          : "border-transparent before:bg-transparent"
      }`}
    >
      <HeaderContent
        withDesktopNavigation
        variant="light"
        titleAs="span"
        navigationToggle={
          <Burger
            opened={drawerOpened}
            onClick={onToggleDrawer}
            aria-label="Toggle navigation"
            aria-expanded={drawerOpened}
            className="shrink-0"
          />
        }
        actions={
          <>
            <nav className="mr-2 hidden items-center gap-5 text-sm text-gray-600 dark:text-gray-100 xl:flex">
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
            <div className="hidden lg:inline-flex">
              <LanguageSwitcher variant="light" />
            </div>
            <div className="lg:hidden">
              <LanguageSwitcher variant="light" compact />
            </div>
            <ThemeToggle className="hover:text-primary-500 dark:hover:bg-primary-800 dark:hover:text-white" />
            <AccountMenu />
          </>
        }
      />
    </header>
  );
}
