"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { FaYoutube } from "react-icons/fa6";
import { Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import FoldableToggle from "./FoldableToggle";
import AccountMenu from "./AccountMenu";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import useSongs from "../hook/useSongs";
import SearchInput from "./SearchInput";
import DrawerMenu from "./DrawerMenu";
import { siteConfig } from "@/app/config/siteConfig";
import { routing } from "../../i18n/routing";
import HeaderContent from "./HeaderContent";

type HeaderProps = {
  navigation?: {
    opened: boolean;
    onToggle: () => void;
  };
  withDesktopNavigation?: boolean;
};

export function Header({
  navigation,
  withDesktopNavigation = false,
}: HeaderProps = {}) {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { allSongs } = useSongs();
  const [searchTerm, setSearchTerm] = useState("");
  const searchParams = useSearchParams();
  const t = useTranslations("Header");
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchQuery = searchParams?.get("q") ?? "";

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const normalizeLocalizedPath = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    if (
      segments.length > 0 &&
      routing.locales.includes(segments[0] as (typeof routing.locales)[number])
    ) {
      const rest = segments.slice(1).join("/");
      return rest ? `/${rest}` : "/";
    }
    return path;
  };
  return (
    <>
      <header className="relative z-30 bg-primary-800 dark:bg-gray-800/75 text-white shadow-md backdrop-blur">
        <HeaderContent
          withDesktopNavigation={withDesktopNavigation}
          navigationToggle={
            <Burger
              opened={navigation?.opened ?? drawerOpened}
              onClick={navigation?.onToggle ?? toggleDrawer}
              color="white"
              aria-label={t("toggleNavigation")}
            />
          }
          actions={
            <>
              <Link
                href={siteConfig.channelUrl}
                target="_blank"
                className="hidden lg:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary-100 dark:text-white bg-primary-800 hover:bg-primary-700 dark:bg-transparent dark:hover:bg-primary-900/50 focus:border-primary-700 focus:ring-primary-700 dark:focus:ring-primary-700"
              >
                <FaYoutube className="mr-1" />
                {siteConfig.channelName}
              </Link>
              <div className="hidden lg:inline-flex">
                <LanguageSwitcher />
              </div>
              <div className="lg:hidden">
                <LanguageSwitcher compact />
              </div>
              <FoldableToggle />
              <ThemeToggle />
              <AccountMenu />
            </>
          }
        >
          {/* 検索フィールド - lg以上で表示 */}
          <div className="hidden min-w-0 lg:flex lg:flex-1 lg:justify-center lg:mx-4">
            <div className="w-full max-w-md">
              <SearchInput
                allSongs={allSongs}
                searchValue={
                  searchTerm
                    ? searchTerm.split("|").filter((v) => v.trim())
                    : []
                }
                onSearchChange={(values: string[]) => {
                  const query = values.join("|");
                  setSearchTerm(query);

                  // 現在のパスを取得
                  const currentPath =
                    typeof window !== "undefined"
                      ? window.location.pathname
                      : pathname;
                  const normalizedPath = normalizeLocalizedPath(currentPath);

                  // 再生ページと検索ページ以外では、検索時だけ検索ページに遷移
                  if (
                    normalizedPath !== "/watch" &&
                    normalizedPath !== "/search"
                  ) {
                    if (!query) {
                      if (typeof window !== "undefined") {
                        const url = new URL(window.location.href);
                        url.searchParams.delete("q");
                        const searchString = url.searchParams.toString();
                        const target = searchString
                          ? `${normalizedPath}?${searchString}`
                          : normalizedPath;
                        router.push(target);
                      } else {
                        router.push(normalizedPath);
                      }
                      return;
                    }

                    // 他のページから検索ページへ遷移する際は、既存の v/t 等を保持して遷移する
                    const searchPath = "/search";

                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.pathname = searchPath;
                      if (query) {
                        url.searchParams.set("q", query);
                      } else {
                        url.searchParams.delete("q");
                      }
                      const target =
                        url.pathname +
                        (url.search ? `?${url.searchParams.toString()}` : "");
                      router.push(target);
                    } else {
                      const searchUrl = query
                        ? `/search?q=${encodeURIComponent(query)}`
                        : "/search";
                      router.push(searchUrl);
                    }
                  } else {
                    // 再生ページと検索ページでは、URLパラメータを更新（既存のパラメータは保持）
                    const pagePath = normalizedPath;

                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      if (query) {
                        url.searchParams.set("q", query);
                      } else {
                        url.searchParams.delete("q");
                      }
                      const searchString = url.searchParams.toString();
                      const target = searchString
                        ? `${pagePath}?${searchString}`
                        : pagePath;
                      router.push(target);
                    } else {
                      const target = query
                        ? `${pagePath}?q=${encodeURIComponent(query)}`
                        : pagePath;
                      router.push(target);
                    }
                  }
                }}
                placeholder={t("searchPlaceholder")}
                className="[&_input]:h-7"
              />
            </div>
          </div>
        </HeaderContent>
      </header>

      {!navigation && (
        <DrawerMenu opened={drawerOpened} onClose={closeDrawer} />
      )}
    </>
  );
}
