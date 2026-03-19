"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Burger, Drawer, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AnalyticsWrapper } from "./components/AnalyticsWrapper";
import SearchInput from "./components/SearchInput";
import Footer from "./components/Footer";
import ThemeToggle from "./components/ThemeToggle";
import YoutubeThumbnail from "./components/YoutubeThumbnail";
import { siteConfig } from "./config/siteConfig";
import useSongs from "./hook/useSongs";
import { buildWatchHref } from "./lib/watchUrl";
import { flowbiteTheme } from "./theme";
import { ThemeProvider } from "flowbite-react";
import { LuSparkles } from "react-icons/lu";
import { FaXTwitter, FaYoutube } from "react-icons/fa6";
import { pageList } from "./pagelists";

const RECOMMENDED_SONG_COUNT = 20;
const RECOMMENDED_SKELETON_COUNT = 20;

function pickRecommendedSongs<T>(items: T[], count: number) {
  if (items.length <= count) {
    return items;
  }

  const pool = [...items];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, count);
}

export default function ClientTop() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { allSongs, songsFetchedAt, isLoading } = useSongs();
  const [searchValue, setSearchValue] = useState<string[]>([]);

  const recommendedSongs = useMemo(
    () => pickRecommendedSongs(allSongs, RECOMMENDED_SONG_COUNT),
    [allSongs],
  );

  const songsUpdatedLabel = useMemo(() => {
    if (!songsFetchedAt) {
      return null;
    }

    const date = new Date(songsFetchedAt);
    if (Number.isNaN(date.getTime())) {
      return songsFetchedAt;
    }

    return date.toLocaleDateString("ja-JP");
  }, [songsFetchedAt]);

  const handleSearch = () => {
    const query = searchValue.join("|").trim();
    startTransition(() => {
      router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
    });
  };

  return (
    <ThemeProvider theme={flowbiteTheme}>
      <div className="min-h-dvh overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(244,114,182,0.18),transparent_38%),linear-gradient(180deg,#fffafc_0%,#fdf2f8_42%,#ffffff_100%)] text-gray-900 dark:bg-[radial-gradient(circle_at_top,rgba(190,24,93,0.2),transparent_34%),linear-gradient(180deg,#111827_0%,#0f172a_40%,#111827_100%)] dark:text-white">
        <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 pb-24 pt-0 lg:pt-6 sm:px-6 lg:px-8">
          <header className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Burger
                  opened={drawerOpened}
                  onClick={toggleDrawer}
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
                <nav className="hidden items-center gap-5 text-sm text-gray-600 dark:text-gray-300 sm:flex">
                  <Link href="/search" className="hover:text-primary">
                    Search
                  </Link>
                  <Link href="/discography" className="hover:text-primary">
                    Discography
                  </Link>
                  <Link href="/statistics" className="hover:text-primary">
                    Stats
                  </Link>
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col">
            <section className="flex min-h-[48dvh] flex-col items-center justify-center py-10 text-center sm:py-16">
              <p className="mb-3 text-xs font-semibold tracking-[0.35em] text-primary/70 dark:text-pink-200/70">
                AZKi VIRTUAL DiVA
              </p>
              <h1 className="max-w-4xl text-balance text-4xl font-black leading-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                音楽で辿る、Virtual DiVAの記録。
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-gray-600 dark:text-gray-300 sm:text-base">
                AZKiさんの楽曲データベース。
                オリジナル楽曲、コラボ楽曲、カバー楽曲だけでなく、歌枠で歌唱したセットリストもまとめています。
              </p>

              <div className="mt-8 w-full max-w-3xl rounded-4xl border border-white/70 bg-white/90 p-4 shadow-[0_24px_80px_rgba(190,24,93,0.16)] backdrop-blur dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-5">
                <SearchInput
                  allSongs={allSongs}
                  searchValue={searchValue}
                  onSearchChange={setSearchValue}
                  placeholder="曲名、アーティスト、タグなどで検索"
                  className="[&_input]:h-12 [&_input]:text-base"
                />
                <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex min-w-40 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isPending}
                  >
                    {isPending ? "移動中..." : "検索する"}
                  </button>
                  <Link
                    href="/search"
                    className="inline-flex min-w-40 items-center justify-center rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:bg-transparent dark:text-pink-100 dark:hover:bg-pink-200/10"
                  >
                    検索ページを開く
                  </Link>
                  <Link
                    href="/watch"
                    className="inline-flex min-w-40 items-center justify-center rounded-full border border-primary/20 bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5 dark:border-pink-200/20 dark:bg-transparent dark:text-pink-100 dark:hover:bg-pink-200/10"
                    title="ランダムで再生する"
                  >
                    <LuSparkles className="mr-1 inline" />
                    Surprise me
                  </Link>
                </div>
              </div>
            </section>

            <section className="pb-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    Recommended
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    おすすめ楽曲
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {isLoading
                  ? Array.from({ length: RECOMMENDED_SKELETON_COUNT }).map(
                      (_, index) => (
                        <div
                          key={`recommended-skeleton-${index}`}
                          className="overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-0 shadow-[0_16px_45px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-gray-900/50 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)]"
                          aria-hidden="true"
                        >
                          <Skeleton height="100%" className="aspect-video" />
                          <div className="space-y-2 p-3">
                            <Skeleton height={16} radius="sm" />
                            <Skeleton height={12} width="70%" radius="sm" />
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <Skeleton height={10} width="28%" radius="sm" />
                              <Skeleton height={10} width="42%" radius="sm" />
                            </div>
                          </div>
                        </div>
                      ),
                    )
                  : recommendedSongs.map((song) => (
                      <Link
                        key={`${song.video_id}-${song.start}-${song.title}`}
                        href={buildWatchHref({
                          videoId: song.video_id,
                          start: song.start,
                        })}
                        className="group overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_16px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(190,24,93,0.18)] dark:border-white/10 dark:bg-gray-900/75 dark:shadow-[0_18px_52px_rgba(0,0,0,0.35)] dark:hover:border-pink-300/30"
                      >
                        <div className="relative aspect-video overflow-hidden bg-black">
                          <YoutubeThumbnail
                            videoId={song.video_id}
                            alt={song.title}
                            fill={true}
                            imageClassName="transition duration-500 group-hover:scale-[1.04]"
                          />
                        </div>
                        <div className="space-y-2 p-3">
                          <div className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                            {song.title}
                          </div>
                          <div className="line-clamp-1 text-xs text-gray-600 dark:text-gray-300">
                            {song.artist}
                          </div>
                          <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
                            <span>{song.year}</span>
                            <span>
                              {new Date(song.broadcast_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
              </div>

              <div className="mt-24 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={siteConfig.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-64 items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
                >
                  <FaYoutube className="mr-2" />
                  {siteConfig.channelName}
                </Link>
                <Link
                  href={siteConfig.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-64 items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  <FaXTwitter className="mr-2" />
                  {siteConfig.xName}
                </Link>
              </div>

              <p className="mt-4 text-center text-xs text-gray-500/80 dark:text-gray-400/80">
                {isLoading
                  ? "収録楽曲数: 読み込み中 / 最終更新日: 読み込み中"
                  : `収録楽曲数: ${allSongs.length.toLocaleString()}曲${songsUpdatedLabel ? ` / 最終更新日: ${songsUpdatedLabel}` : ""}`}
              </p>
            </section>
          </main>

          <Footer />
        </div>
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          title="Menu"
          overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        >
          <div className="grow space-y-1">
            {pageList.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                {category.category && (
                  <div className="ml-3 mt-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {category.category}
                  </div>
                )}
                {category.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
                    onClick={() => closeDrawer()}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ))}
            <hr className="my-6 border border-light-gray-200 dark:border-gray-600" />

            <div className="ml-3 text-xs text-light-gray-400 dark:text-gray-300">
              管理機能
            </div>
            <Link
              href="/playlist"
              className="block rounded-md px-3 py-2 text-base font-medium cursor-pointer hover:bg-white/5 hover:text-primary dark:hover:text-white"
              onClick={() => closeDrawer()}
            >
              プレイリスト
            </Link>
          </div>
        </Drawer>
        <AnalyticsWrapper />
      </div>
    </ThemeProvider>
  );
}
