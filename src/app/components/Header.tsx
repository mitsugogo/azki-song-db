"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaYoutube } from "react-icons/fa6";
import { Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import ThemeToggle from "./ThemeToggle";
import FoldableToggle from "./FoldableToggle";
import useSongs from "../hook/useSongs";
import useSearch from "../hook/useSearch";
import SearchInput from "./SearchInput";
import DrawerMenu from "./DrawerMenu";
import { siteConfig } from "@/app/config/siteConfig";

export function Header() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { allSongs, songsFetchedAt } = useSongs();
  const { searchTerm, setSearchTerm } = useSearch(allSongs);
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  return (
    <>
      <header className="relative bg-primary dark:bg-gray-800/75 text-white shadow-md backdrop-blur">
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
                  <h1 className="text-lg lg:text-lg font-semibold tracking-[0.06em]">
                    {siteConfig.siteNameUpper}
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
                          : pathname;

                      // 再生ページと検索ページ以外では、検索ページに遷移
                      if (path !== "/watch" && path !== "/search") {
                        // 他のページから検索ページへ遷移する際は、既存の v/t を保持して遷移する
                        if (typeof window !== "undefined") {
                          const url = new URL(window.location.href);
                          url.pathname = "/search";
                          if (query) {
                            url.searchParams.set("q", query);
                          } else {
                            url.searchParams.delete("q");
                          }
                          const target =
                            url.pathname +
                            (url.search
                              ? `?${url.searchParams.toString()}`
                              : "");
                          router.push(target);
                        } else {
                          const searchUrl = query
                            ? `/search?q=${encodeURIComponent(query)}`
                            : "/search";
                          router.push(searchUrl);
                        }
                      } else {
                        // 再生ページと検索ページでは、URLパラメータを更新
                        if (query) {
                          router.push(`${path}?q=${encodeURIComponent(query)}`);
                        } else {
                          // 検索ワードをクリアする際は、既存の検索パラメータ(v/t 等)を保持しつつ q のみ削除する
                          if (typeof window !== "undefined") {
                            const url = new URL(window.location.href);
                            url.searchParams.delete("q");
                            const searchString = url.searchParams.toString();
                            const target = searchString
                              ? `${path}?${searchString}`
                              : path;
                            router.push(target);
                          } else {
                            router.push(path);
                          }
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
                href={siteConfig.channelUrl}
                target="_blank"
                className="hidden lg:inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-primary-100 dark:text-primary-200 bg-primary-700 hover:bg-primary-600 dark:bg-primary-900/30 dark:hover:bg-primary-800 focus:border-primary-700 focus:ring-primary-700 dark:focus:ring-primary-700"
              >
                <FaYoutube className="mr-1" />
                {siteConfig.channelName}
              </Link>
              <FoldableToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <DrawerMenu opened={drawerOpened} onClose={closeDrawer} />
    </>
  );
}
